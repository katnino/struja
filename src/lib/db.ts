import type { TariffRates } from "./tariff";
import { createClient } from "./supabase/server";

export type TariffGroup = "TG1" | "TG2";

export interface Meter {
  id: string;
  user_id: string;
  name: string;
  tariff_group: TariffGroup;
  approved_kw: number;
  notes: string | null;
  created_at: string;
}

export interface Reading {
  id: string;
  meter_id: string;
  user_id: string;
  recorded_at: string;
  reading: number | null;
  vt: number | null;
  mt: number | null;
  source: "manual" | "ai" | "csv";
  confidence: "high" | "low" | null;
  created_at: string;
}

export interface Bill {
  id: string;
  meter_id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  prev_reading_id: string | null;
  curr_reading_id: string | null;
  tariff_rates_id: number | null;
  approved_kw: number;
  consumption_kwh: number;
  mjerno_mjesto: number;
  obracunska_snaga: number;
  energy_cost: number;
  oie_cost: number;
  subtotal: number;
  vat_amount: number;
  total: number;
  blocks: Array<{
    label: string;
    kwh: number;
    rate: number;
    cost: number;
    oie: number;
  }>;
  created_at: string;
}

// Flat row select — Supabase doesn't support nested aliases in `select`,
// so we read flat columns then map to the nested TariffRates shape below.
const TARIFF_RATES_COLUMNS =
  "id, effective_from, source_label, " +
  "mjerno_mjesto, obracunska_snaga, oie_rate, vat, " +
  "block_i, block_ii, " +
  "tg1_i, tg1_ii, tg1_iii, " +
  "tg2_vt_i, tg2_vt_ii, tg2_vt_iii, " +
  "tg2_mt_i, tg2_mt_ii, tg2_mt_iii";

export async function fetchTariffRates(): Promise<TariffRates> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tariff_rates")
    .select(TARIFF_RATES_COLUMNS)
    .eq("id", 1)
    .single();
  if (error || !data) {
    const { DEFAULT_RATES } = await import("./tariff");
    return DEFAULT_RATES;
  }
  const row = data as unknown as Record<string, string | number>;
  return {
    mjernoMjesto: Number(row.mjerno_mjesto),
    obracunskaSnagaRate: Number(row.obracunska_snaga),
    oieRate: Number(row.oie_rate),
    vat: Number(row.vat),
    blockI: Number(row.block_i),
    blockII: Number(row.block_ii),
    tg1: {
      i: Number(row.tg1_i),
      ii: Number(row.tg1_ii),
      iii: Number(row.tg1_iii),
    },
    tg2Vt: {
      i: Number(row.tg2_vt_i),
      ii: Number(row.tg2_vt_ii),
      iii: Number(row.tg2_vt_iii),
    },
    tg2Mt: {
      i: Number(row.tg2_mt_i),
      ii: Number(row.tg2_mt_ii),
      iii: Number(row.tg2_mt_iii),
    },
  };
}

export async function fetchMeters(): Promise<Meter[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meters")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Meter[];
}

export async function fetchMeter(id: string): Promise<Meter | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meters")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Meter | null) ?? null;
}

export async function fetchReadings(meterId: string): Promise<Reading[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("readings")
    .select("*")
    .eq("meter_id", meterId)
    .order("recorded_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Reading[];
}

export async function fetchLatestReading(meterId: string): Promise<Reading | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("readings")
    .select("*")
    .eq("meter_id", meterId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as Reading | null) ?? null;
}

export async function fetchBills(meterId: string): Promise<Bill[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("meter_id", meterId)
    .order("period_end", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Bill[];
}

export async function fetchBill(billId: string): Promise<Bill | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("id", billId)
    .maybeSingle();
  if (error) throw error;
  return (data as Bill | null) ?? null;
}

export async function getAuthUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
