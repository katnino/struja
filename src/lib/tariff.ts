// REERS Odluka 15.12.2022, primjena od 01.01.2023.
// Dual-tariff (dvotarifna) calculation: meter records VT and MT,
// total consumption = VT + MT, split into 3 blocks, each charged
// at VT and MT rates proportional to their share of total.

export type TariffGroup = "TG2";

export interface TariffRates {
  mjernoMjesto: number;
  obracunskaSnagaRate: number;
  oieRate: number;
  vat: number;
  blockI: number;
  blockII: number;
  vt: { i: number; ii: number; iii: number };
  mt: { i: number; ii: number; iii: number };
}

export const DEFAULT_RATES: TariffRates = {
  mjernoMjesto: 2.48,
  obracunskaSnagaRate: 3.1668,
  oieRate: 0.0007,
  vat: 0.17,
  blockI: 500,
  blockII: 1500,
  vt: { i: 0.1324, ii: 0.1770, iii: 0.3094 },
  mt: { i: 0.0663, ii: 0.0886, iii: 0.1548 },
};

export interface BlockBreakdown {
  label: string;
  kwh: number;
  rate: number;
  cost: number;
  oie: number;
}

export interface BillResult {
  blocks: BlockBreakdown[];
  totalKwh: number;
  mjernoMjesto: number;
  obracunskaSnaga: number;
  totalEnergy: number;
  totalOie: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  consumptionKwh: number;
  isPartialObračun?: boolean;
}

export function splitBlocks(total: number, rates: TariffRates = DEFAULT_RATES) {
  const i = Math.min(total, rates.blockI);
  const ii = Math.min(Math.max(total - rates.blockI, 0), rates.blockII - rates.blockI);
  const iii = Math.max(total - rates.blockII, 0);
  return { i, ii, iii };
}

export function calculateBill(
  vtKwh: number,
  mtKwh: number,
  approvedKw = 3.3,
  rates: TariffRates = DEFAULT_RATES,
  daysInPeriod?: number
): BillResult {
  if (!Number.isFinite(vtKwh) || !Number.isFinite(mtKwh) || vtKwh < 0 || mtKwh < 0) {
    return buildResult([], 0, approvedKw, rates, daysInPeriod);
  }
  const consumptionKwh = vtKwh + mtKwh;
  if (consumptionKwh === 0) return buildResult([], 0, approvedKw, rates, daysInPeriod);

  const vtRatio = vtKwh / consumptionKwh;
  const mtRatio = mtKwh / consumptionKwh;
  const { i, ii, iii } = splitBlocks(consumptionKwh, rates);
  const blocks: BlockBreakdown[] = [];

  if (i > 0) {
    const cost = i * vtRatio * rates.vt.i + i * mtRatio * rates.mt.i;
    blocks.push({ label: "Blok I (0-500 kWh)", kwh: i, rate: cost / i, cost, oie: i * rates.oieRate });
  }
  if (ii > 0) {
    const cost = ii * vtRatio * rates.vt.ii + ii * mtRatio * rates.mt.ii;
    blocks.push({ label: "Blok II (501-1500 kWh)", kwh: ii, rate: cost / ii, cost, oie: ii * rates.oieRate });
  }
  if (iii > 0) {
    const cost = iii * vtRatio * rates.vt.iii + iii * mtRatio * rates.mt.iii;
    blocks.push({ label: "Blok III (1501+ kWh)", kwh: iii, rate: cost / iii, cost, oie: iii * rates.oieRate });
  }
  return buildResult(blocks, consumptionKwh, approvedKw, rates, daysInPeriod);
}

function buildResult(blocks: BlockBreakdown[], totalKwh: number, approvedKw: number, rates: TariffRates, daysInPeriod?: number): BillResult {
  const isPartial = daysInPeriod !== undefined && daysInPeriod < 29;
  const mjernoMjesto = isPartial ? 0 : rates.mjernoMjesto;
  const obracunskaSnaga = isPartial ? 0 : approvedKw * rates.obracunskaSnagaRate;
  const totalEnergy = blocks.reduce((s, b) => s + b.cost, 0);
  const totalOie = blocks.reduce((s, b) => s + b.oie, 0);
  const subtotal = mjernoMjesto + obracunskaSnaga + totalEnergy + totalOie;
  const vatAmount = subtotal * rates.vat;
  return {
    blocks,
    totalKwh,
    mjernoMjesto,
    obracunskaSnaga,
    totalEnergy,
    totalOie,
    subtotal,
    vatAmount,
    total: subtotal + vatAmount,
    consumptionKwh: totalKwh,
    isPartialObračun: isPartial,
  };
}

