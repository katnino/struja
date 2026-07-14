import type { TariffRates } from "./tariff";
import { createClient } from "./supabase/server";
import { encryptSecret, decryptSecret } from "./crypto";

export interface Meter {
  id: string;
  user_id: string;
  name: string;
  tariff_group: "TG2";
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
    activeEnergyCost: number;
    transmissionCost: number;
    distributionCost: number;
    oieCost: number;
    totalCost: number;
  }>;
  created_at: string;
}

const TARIFF_RATES_COLUMNS =
  "id, effective_from, source_label, " +
  "service_fee, power_flat_rate, power_kw_rate, oie_rate, vat, " +
  "block_i, block_ii, " +
  "tg2_vt_i, tg2_vt_ii, tg2_vt_iii, " +
  "tg2_mt_i, tg2_mt_ii, tg2_mt_iii, " +
  "transmission_vt, transmission_mt, " +
  "distribution_vt, distribution_mt";

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
    serviceFee: Number(row.service_fee),
    powerFlatRate: Number(row.power_flat_rate),
    powerKwRate: Number(row.power_kw_rate),
    oieRate: Number(row.oie_rate),
    vat: Number(row.vat),
    blockI: Number(row.block_i),
    blockII: Number(row.block_ii),
    vt: {
      i: Number(row.tg2_vt_i),
      ii: Number(row.tg2_vt_ii),
      iii: Number(row.tg2_vt_iii),
    },
    mt: {
      i: Number(row.tg2_mt_i),
      ii: Number(row.tg2_mt_ii),
      iii: Number(row.tg2_mt_iii),
    },
    transmission: {
      vt: Number(row.transmission_vt),
      mt: Number(row.transmission_mt),
    },
    distribution: {
      vt: Number(row.distribution_vt),
      mt: Number(row.distribution_mt),
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

export async function fetchUserApiKey(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_settings")
    .select("ai_api_key")
    .eq("user_id", userId)
    .maybeSingle();
  const stored = (data?.ai_api_key as string | null) ?? null;
  if (!stored) return null;
  return decryptSecret(stored);
}

export async function saveUserApiKey(
  userId: string,
  key: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("user_settings").upsert(
    { user_id: userId, ai_api_key: encryptSecret(key), updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);
}
