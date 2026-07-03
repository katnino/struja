"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, fetchMeter, fetchLatestReading, fetchTariffRates, type TariffGroup } from "@/lib/db";
import { calculateBill } from "@/lib/tariff";

function fail(meterId: string, error: string): never {
  const params = new URLSearchParams({ error });
  redirect(`/meters/${meterId}/readings/new?${params.toString()}`);
}

interface NewReadingInput {
  meter_id: string;
  recorded_at: string;
  reading?: number;
  vt?: number;
  mt?: number;
  source?: "manual" | "ai";
}

export async function createReadingAction(input: NewReadingInput) {
  const user = await getAuthUser();
  if (!user) fail(input.meter_id, "Niste prijavljeni.");

  const meter = await fetchMeter(input.meter_id);
  if (!meter) fail(input.meter_id, "Brojilo ne postoji.");
  if (meter.user_id !== user!.id) fail(input.meter_id, "Nemate pristup ovom brojilu.");

  const rates = await fetchTariffRates();
  const prev = await fetchLatestReading(input.meter_id);

  const prevValues = prev
    ? { reading: prev.reading ?? undefined, vt: prev.vt ?? undefined, mt: prev.mt ?? undefined }
    : { reading: undefined as number | undefined, vt: undefined as number | undefined, mt: undefined as number | undefined };

  const group = meter.tariff_group as TariffGroup;

  if (group === "TG1") {
    if (input.reading === undefined || !Number.isFinite(input.reading)) {
      fail(input.meter_id, "Unesite trenutno stanje brojila.");
    }
    if (prevValues.reading !== undefined && input.reading! < prevValues.reading) {
      fail(input.meter_id, "Trenutno stanje ne može biti manje od prethodnog.");
    }
  } else {
    if (input.vt === undefined || input.mt === undefined ||
        !Number.isFinite(input.vt) || !Number.isFinite(input.mt)) {
      fail(input.meter_id, "Unesite VT i MT očitavanje.");
    }
    if (prevValues.vt !== undefined && input.vt! < prevValues.vt) {
      fail(input.meter_id, "Trenutno VT stanje ne može biti manje od prethodnog.");
    }
    if (prevValues.mt !== undefined && input.mt! < prevValues.mt) {
      fail(input.meter_id, "Trenutno MT stanje ne može biti manje od prethodnog.");
    }
  }

  const supabase = await createClient();

  const readingPayload: Record<string, unknown> = {
    meter_id: meter!.id,
    user_id: user!.id,
    recorded_at: input.recorded_at,
    source: input.source ?? "manual",
  };
  if (group === "TG1") readingPayload.reading = input.reading;
  else {
    readingPayload.vt = input.vt;
    readingPayload.mt = input.mt;
  }
  const { data: readingRow, error: readingErr } = await supabase
    .from("readings")
    .insert(readingPayload)
    .select("id")
    .single();
  if (readingErr || !readingRow) fail(input.meter_id, `Spremanje očitanja neuspješno: ${readingErr?.message ?? ""}`);

  if (prev) {
    const result = calculateBill(
      group,
      Number(meter!.approved_kw),
      prevValues,
      group === "TG1"
        ? { reading: input.reading }
        : { vt: input.vt, mt: input.mt },
      rates
    );

    const { error: billErr } = await supabase.from("bills").insert({
      meter_id: meter!.id,
      user_id: user!.id,
      period_start: prev.recorded_at,
      period_end: input.recorded_at,
      prev_reading_id: prev.id,
      curr_reading_id: readingRow!.id,
      tariff_rates_id: 1,
      approved_kw: meter!.approved_kw,
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
    if (billErr) fail(input.meter_id, `Spremanje računa neuspješno: ${billErr.message}`);
  }

  revalidatePath(`/meters/${meter!.id}`);
  redirect(`/meters/${meter!.id}`);
}
