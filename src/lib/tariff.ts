// REERS Odluka 15.12.2022, primjena od 01.01.2023.
// Source: original ERSCalculator.jsx — extracted as pure functions so they
// can be reused in API routes, server components, and tests.

export type TariffGroup = "TG1" | "TG2";

export interface TariffRates {
  mjernoMjesto: number;
  obracunskaSnagaRate: number;
  oieRate: number;
  vat: number;
  blockI: number;
  blockII: number;
  tg1: { i: number; ii: number; iii: number };
  tg2Vt: { i: number; ii: number; iii: number };
  tg2Mt: { i: number; ii: number; iii: number };
}

export const DEFAULT_RATES: TariffRates = {
  mjernoMjesto: 2.48,
  obracunskaSnagaRate: 3.1668,
  oieRate: 0.0007,
  vat: 0.17,
  blockI: 500,
  blockII: 1500,
  tg1: { i: 0.1053, ii: 0.1423, iii: 0.2522 },
  tg2Vt: { i: 0.1324, ii: 0.1770, iii: 0.3094 },
  tg2Mt: { i: 0.0663, ii: 0.0886, iii: 0.1548 },
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
}

export function splitBlocks(total: number, rates: TariffRates = DEFAULT_RATES) {
  const i = Math.min(total, rates.blockI);
  const ii = Math.min(Math.max(total - rates.blockI, 0), rates.blockII - rates.blockI);
  const iii = Math.max(total - rates.blockII, 0);
  return { i, ii, iii };
}

export function calculateTG1(
  consumptionKwh: number,
  approvedKw = 3.3,
  rates: TariffRates = DEFAULT_RATES
): BillResult {
  const { i, ii, iii } = splitBlocks(consumptionKwh, rates);
  const blocks: BlockBreakdown[] = [];
  if (i > 0) blocks.push({ label: "Blok I (0-500 kWh)", kwh: i, rate: rates.tg1.i, cost: i * rates.tg1.i, oie: i * rates.oieRate });
  if (ii > 0) blocks.push({ label: "Blok II (501-1500 kWh)", kwh: ii, rate: rates.tg1.ii, cost: ii * rates.tg1.ii, oie: ii * rates.oieRate });
  if (iii > 0) blocks.push({ label: "Blok III (1501+ kWh)", kwh: iii, rate: rates.tg1.iii, cost: iii * rates.tg1.iii, oie: iii * rates.oieRate });
  return buildResult(blocks, consumptionKwh, approvedKw, rates);
}

export function calculateTG2(
  vtKwh: number,
  mtKwh: number,
  approvedKw = 3.3,
  rates: TariffRates = DEFAULT_RATES
): BillResult {
  const consumptionKwh = vtKwh + mtKwh;
  if (consumptionKwh === 0) return buildResult([], 0, approvedKw, rates);

  const vtRatio = vtKwh / consumptionKwh;
  const mtRatio = mtKwh / consumptionKwh;
  const { i, ii, iii } = splitBlocks(consumptionKwh, rates);
  const blocks: BlockBreakdown[] = [];

  if (i > 0) {
    const cost = i * vtRatio * rates.tg2Vt.i + i * mtRatio * rates.tg2Mt.i;
    blocks.push({ label: "Blok I (0-500 kWh)", kwh: i, rate: cost / i, cost, oie: i * rates.oieRate });
  }
  if (ii > 0) {
    const cost = ii * vtRatio * rates.tg2Vt.ii + ii * mtRatio * rates.tg2Mt.ii;
    blocks.push({ label: "Blok II (501-1500 kWh)", kwh: ii, rate: cost / ii, cost, oie: ii * rates.oieRate });
  }
  if (iii > 0) {
    const cost = iii * vtRatio * rates.tg2Vt.iii + iii * mtRatio * rates.tg2Mt.iii;
    blocks.push({ label: "Blok III (1501+ kWh)", kwh: iii, rate: cost / iii, cost, oie: iii * rates.oieRate });
  }
  return buildResult(blocks, consumptionKwh, approvedKw, rates);
}

function buildResult(blocks: BlockBreakdown[], totalKwh: number, approvedKw: number, rates: TariffRates): BillResult {
  const mjernoMjesto = rates.mjernoMjesto;
  const obracunskaSnaga = approvedKw * rates.obracunskaSnagaRate;
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
  };
}

export function calculateBill(
  tariffGroup: TariffGroup,
  approvedKw: number,
  prev: { vt?: number; mt?: number; reading?: number },
  curr: { vt?: number; mt?: number; reading?: number },
  rates: TariffRates = DEFAULT_RATES
): BillResult {
  if (tariffGroup === "TG1") {
    const cur = curr.reading ?? 0;
    const prevVal = prev.reading ?? 0;
    return calculateTG1(cur - prevVal, approvedKw, rates);
  }
  return calculateTG2(
    (curr.vt ?? 0) - (prev.vt ?? 0),
    (curr.mt ?? 0) - (prev.mt ?? 0),
    approvedKw,
    rates
  );
}
