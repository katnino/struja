// REERS Odluka 17.12.2024, primjena od 01.06.2026.
// Dual-tariff (dvotarifna) calculation:
// - active energy is split into 3 blocks and blended by VT/MT share
// - transmission, distribution, and OIE are charged on the same
//   consumption base, but separately from active energy
// - fixed service and power charges are added afterward

export type TariffGroup = "TG2";

export interface TariffRates {
  serviceFee: number;
  powerFlatRate: number;
  powerKwRate: number;
  oieRate: number;
  vat: number;
  blockI: number;
  blockII: number;
  vt: { i: number; ii: number; iii: number };
  mt: { i: number; ii: number; iii: number };
  transmission: { vt: number; mt: number };
  distribution: { vt: number; mt: number };
}

export const DEFAULT_RATES: TariffRates = {
  serviceFee: 2.48,
  powerFlatRate: 0.2467,
  powerKwRate: 3.2425,
  oieRate: 0.0007,
  vat: 0.17,
  blockI: 500,
  blockII: 1500,
  vt: { i: 0.0813, ii: 0.1277, iii: 0.2425 },
  mt: { i: 0.0406, ii: 0.0638, iii: 0.1212 },
  transmission: { vt: 0.0120, mt: 0.0060 },
  distribution: { vt: 0.0673, mt: 0.0337 },
};

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface BlockBreakdown {
  label: string;
  kwh: number;
  rate: number;
  activeEnergyCost: number;
  transmissionCost: number;
  distributionCost: number;
  oieCost: number;
  totalCost: number;
}

export interface BillResult {
  blocks: BlockBreakdown[];
  totalKwh: number;
  mjernoMjesto: number;
  obracunskaSnaga: number;
  serviceFee: number;
  totalEnergy: number;
  transmissionBaseCost: number;
  totalTransmission: number;
  distributionBaseCost: number;
  totalDistribution: number;
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
    const activeEnergyCost = roundMoney(i * vtRatio * rates.vt.i + i * mtRatio * rates.mt.i);
    const transmissionCost = roundMoney(i * vtRatio * rates.transmission.vt) + roundMoney(i * mtRatio * rates.transmission.mt);
    const distributionCost = roundMoney(i * vtRatio * rates.distribution.vt) + roundMoney(i * mtRatio * rates.distribution.mt);
    const oieCost = roundMoney(i * vtRatio * rates.oieRate) + roundMoney(i * mtRatio * rates.oieRate);
    blocks.push({
      label: "Blok I (0-500 kWh)",
      kwh: i,
      rate: activeEnergyCost / i,
      activeEnergyCost,
      transmissionCost,
      distributionCost,
      oieCost,
      totalCost: activeEnergyCost + transmissionCost + distributionCost + oieCost,
    });
  }
  if (ii > 0) {
    const activeEnergyCost = roundMoney(ii * vtRatio * rates.vt.ii + ii * mtRatio * rates.mt.ii);
    const transmissionCost = roundMoney(ii * vtRatio * rates.transmission.vt) + roundMoney(ii * mtRatio * rates.transmission.mt);
    const distributionCost = roundMoney(ii * vtRatio * rates.distribution.vt) + roundMoney(ii * mtRatio * rates.distribution.mt);
    const oieCost = roundMoney(ii * vtRatio * rates.oieRate) + roundMoney(ii * mtRatio * rates.oieRate);
    blocks.push({
      label: "Blok II (501-1500 kWh)",
      kwh: ii,
      rate: activeEnergyCost / ii,
      activeEnergyCost,
      transmissionCost,
      distributionCost,
      oieCost,
      totalCost: activeEnergyCost + transmissionCost + distributionCost + oieCost,
    });
  }
  if (iii > 0) {
    const activeEnergyCost = roundMoney(iii * vtRatio * rates.vt.iii + iii * mtRatio * rates.mt.iii);
    const transmissionCost = roundMoney(iii * vtRatio * rates.transmission.vt) + roundMoney(iii * mtRatio * rates.transmission.mt);
    const distributionCost = roundMoney(iii * vtRatio * rates.distribution.vt) + roundMoney(iii * mtRatio * rates.distribution.mt);
    const oieCost = roundMoney(iii * vtRatio * rates.oieRate) + roundMoney(iii * mtRatio * rates.oieRate);
    blocks.push({
      label: "Blok III (1501+ kWh)",
      kwh: iii,
      rate: activeEnergyCost / iii,
      activeEnergyCost,
      transmissionCost,
      distributionCost,
      oieCost,
      totalCost: activeEnergyCost + transmissionCost + distributionCost + oieCost,
    });
  }
  return buildResult(blocks, consumptionKwh, approvedKw, rates, daysInPeriod);
}

function buildResult(blocks: BlockBreakdown[], totalKwh: number, approvedKw: number, rates: TariffRates, daysInPeriod?: number): BillResult {
  const isPartial = daysInPeriod !== undefined && daysInPeriod < 29;

  if (totalKwh === 0) {
    return {
      blocks,
      totalKwh,
      mjernoMjesto: 0,
      obracunskaSnaga: 0,
      serviceFee: 0,
      totalEnergy: 0,
      transmissionBaseCost: 0,
      totalTransmission: 0,
      distributionBaseCost: 0,
      totalDistribution: 0,
      totalOie: 0,
      subtotal: 0,
      vatAmount: 0,
      total: 0,
      consumptionKwh: totalKwh,
      isPartialObračun: isPartial,
    };
  }

  const serviceFee = rates.serviceFee;
  const transmissionPowerFee = roundMoney(approvedKw * rates.powerFlatRate);
  const distributionPowerFee = roundMoney(approvedKw * rates.powerKwRate);

  const totalEnergy = roundMoney(blocks.reduce((s, b) => s + b.activeEnergyCost, 0));
  const transmissionBaseCost = roundMoney(blocks.reduce((s, b) => s + b.transmissionCost, 0));
  const distributionBaseCost = roundMoney(blocks.reduce((s, b) => s + b.distributionCost, 0));
  const totalOie = roundMoney(blocks.reduce((s, b) => s + b.oieCost, 0));
  const includedTransmissionPowerFee = isPartial ? 0 : transmissionPowerFee;
  const includedDistributionPowerFee = isPartial ? 0 : distributionPowerFee;
  const totalTransmission = roundMoney(transmissionBaseCost + includedTransmissionPowerFee);
  const totalDistribution = roundMoney(distributionBaseCost + includedDistributionPowerFee);

  const includedFixedCharges = isPartial ? 0 : serviceFee;
  const subtotal = roundMoney(includedFixedCharges + totalEnergy + totalTransmission + totalDistribution + totalOie);
  const vatAmount = roundMoney(subtotal * rates.vat);

  return {
    blocks,
    totalKwh,
    mjernoMjesto: serviceFee,
    obracunskaSnaga: isPartial ? 0 : transmissionPowerFee + distributionPowerFee,
    serviceFee,
    totalEnergy,
    transmissionBaseCost,
    totalTransmission,
    distributionBaseCost,
    totalDistribution,
    totalOie,
    subtotal,
    vatAmount,
    total: roundMoney(subtotal + vatAmount),
    consumptionKwh: totalKwh,
    isPartialObračun: isPartial,
  };
}

export function summarizeBlocks(blocks: BlockBreakdown[]) {
  return blocks.reduce(
    (acc, block) => ({
      totalKwh: acc.totalKwh + block.kwh,
      totalEnergy: roundMoney(acc.totalEnergy + (block.activeEnergyCost ?? (block as { cost?: number }).cost ?? 0)),
      totalTransmission: roundMoney(acc.totalTransmission + (block.transmissionCost ?? 0)),
      totalDistribution: roundMoney(acc.totalDistribution + (block.distributionCost ?? 0)),
      totalOie: roundMoney(acc.totalOie + (block.oieCost ?? (block as { oie?: number }).oie ?? 0)),
      subtotal: roundMoney(acc.subtotal + (block.totalCost ?? ((block.activeEnergyCost ?? (block as { cost?: number }).cost ?? 0) + (block.transmissionCost ?? 0) + (block.distributionCost ?? 0) + (block.oieCost ?? (block as { oie?: number }).oie ?? 0)))),
    }),
    {
      totalKwh: 0,
      totalEnergy: 0,
      totalTransmission: 0,
      totalDistribution: 0,
      totalOie: 0,
      subtotal: 0,
    },
  );
}
