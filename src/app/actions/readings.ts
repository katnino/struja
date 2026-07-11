"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, fetchMeter, fetchLatestReading, fetchTariffRates } from "@/lib/db";
import { calculateBill } from "@/lib/tariff";

function friendlyError(msg: string): string {
  if (msg.includes("duplicate key")) return "Ovaj podatak već postoji.";
  if (msg.includes("violates row-level security")) return "Nemate dozvolu za ovu operaciju.";
  if (msg.includes("foreign key constraint")) return "Povezani podatak ne postoji.";
  return msg;
}

function fail(meterId: string, error: string): never {
  const params = new URLSearchParams({ error });
  redirect(`/meters/${meterId}/readings/new?${params.toString()}`);
}

interface NewReadingInput {
  meter_id: string;
  recorded_at: string;
  vt?: number;
  mt?: number;
  source?: "manual" | "ai";
}

export async function createReadingAction(input: NewReadingInput) {
  const user = await getAuthUser();
  if (!user) fail(input.meter_id, "Niste prijavljeni.");

  const meter = await fetchMeter(input.meter_id);
  if (!meter) fail(input.meter_id, "Brojilo ne postoji.");
  if (meter.user_id !== user.id) fail(input.meter_id, "Nemate pristup ovom brojilu.");

  if (input.vt === undefined || input.mt === undefined ||
      !Number.isFinite(input.vt) || !Number.isFinite(input.mt)) {
    fail(input.meter_id, "Unesite VT i MT očitavanje.");
  }
  if (input.vt! < 0 || input.mt! < 0) {
    fail(input.meter_id, "Očitanje ne može biti negativno.");
  }

  const recordedAt = new Date(input.recorded_at);
  if (isNaN(recordedAt.getTime())) {
    fail(input.meter_id, "Datum nije ispravan.");
  }
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (recordedAt > today) {
    fail(input.meter_id, "Datum ne može biti u budućnosti.");
  }

  const rates = await fetchTariffRates();
  const prev = await fetchLatestReading(input.meter_id);

  // Reject if previous reading has null VT or MT — consumption can't be computed
  if (prev && (prev.vt === null || prev.mt === null)) {
    fail(input.meter_id, "Prethodno očitanje ima nepotpune podatke.");
  }

  const prevVt = prev?.vt ?? undefined;
  const prevMt = prev?.mt ?? undefined;

  if (prevVt !== undefined && input.vt! < prevVt) {
    fail(input.meter_id, "Trenutno VT stanje ne može biti manje od prethodnog.");
  }
  if (prevMt !== undefined && input.mt! < prevMt) {
    fail(input.meter_id, "Trenutno MT stanje ne može biti manje od prethodnog.");
  }

  const supabase = await createClient();

  const { data: readingRow, error: readingErr } = await supabase
    .from("readings")
    .insert({
      meter_id: meter.id,
      user_id: user.id,
      recorded_at: input.recorded_at,
      vt: input.vt,
      mt: input.mt,
      source: input.source ?? "manual",
    })
    .select("id")
    .single();
  if (readingErr || !readingRow) fail(input.meter_id, `Spremanje očitanja neuspješno: ${friendlyError(readingErr?.message ?? "")}`);

  if (prev) {
    const consumptionVt = input.vt! - (prevVt ?? 0);
    const consumptionMt = input.mt! - (prevMt ?? 0);
    const prevDate = new Date(prev.recorded_at);
    const currDate = new Date(input.recorded_at);
    const daysInPeriod = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    const result = calculateBill(
      consumptionVt,
      consumptionMt,
      Number(meter.approved_kw),
      rates,
      daysInPeriod
    );

    const { error: billErr } = await supabase.from("bills").insert({
      meter_id: meter.id,
      user_id: user.id,
      period_start: prev.recorded_at,
      period_end: input.recorded_at,
      prev_reading_id: prev.id,
      curr_reading_id: readingRow!.id,
      tariff_rates_id: 1,
      approved_kw: meter.approved_kw,
      consumption_kwh: result.consumptionKwh,
      mjerno_mjesto: result.mjernoMjesto,
      obracunska_snaga: result.obracunskaSnaga,
      energy_cost: result.totalEnergy,
      oie_cost: result.totalOie,
      subtotal: result.subtotal,
      vat_amount: result.vatAmount,
      total: result.total,
      blocks: result.blocks,
    });
    if (billErr) fail(input.meter_id, `Spremanje računa neuspješno: ${friendlyError(billErr.message)}`);
  }

  revalidatePath(`/meters/${meter.id}`);
  redirect(`/meters/${meter.id}`);
}
