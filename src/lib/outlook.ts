// Month outlook: combines *actual* consumption measured so far this
// calendar month with a *projected* estimate for the remaining days,
// based on a recent daily run-rate. Read-only / not persisted anywhere —
// this never touches the `bills` table, it's purely a dashboard view
// computed on demand from existing readings.
//
// IMPORTANT SIMPLIFICATION: `getActualMonthProgress` treats the entire
// delta between the baseline reading (last reading before the month
// started) and the latest in-month reading as belonging to "this month".
// If the baseline reading was taken a few days before the 1st, a small
// sliver of that consumption technically belongs to the previous month.
// This is deliberate: precise month-boundary splitting is a bigger,
// separate change (see the real-proration discussion) — this module is
// the cheap, additive "outlook" layer, not the source of truth for bills.

import {
  calculateBill,
  DEFAULT_RATES,
  type BillResult,
  type TariffRates,
} from "./tariff";
import type { Reading } from "./db";

export interface MonthKey {
  year: number;
  month: number; // 1-12
}

export interface ActualMonthProgress {
  vtKwh: number;
  mtKwh: number;
  daysElapsed: number;
  lastReadingDate: string;
}

export interface RunRate {
  vtPerDay: number;
  mtPerDay: number;
  source: "rolling_average" | "last_interval";
  basedOnDays: number;
}

export interface MonthOutlook {
  monthKey: MonthKey;
  daysInMonth: number;
  actual: ActualMonthProgress | null;
  runRate: RunRate | null;
  projectedRemainingVt: number;
  projectedRemainingMt: number;
  totalEstimatedVt: number;
  totalEstimatedMt: number;
  bill: BillResult | null;
  confidence: "measured" | "projected" | "insufficient_data";
}

const ROLLING_WINDOW_DAYS = 3;

export function currentMonthKey(now: Date = new Date()): MonthKey {
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function daysInMonth(key: MonthKey): number {
  return new Date(key.year, key.month, 0).getDate();
}

function monthStart(key: MonthKey): Date {
  return new Date(key.year, key.month - 1, 1);
}

function monthEnd(key: MonthKey): Date {
  return new Date(key.year, key.month, 0);
}

function parseDate(iso: string): Date {
  // recorded_at is a plain `date` column (YYYY-MM-DD), parse as local date
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateDiffDays(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function sortedByDateAsc(readings: Reading[]): Reading[] {
  return [...readings]
    .filter((r) => r.vt != null && r.mt != null)
    .sort(
      (a, b) =>
        parseDate(a.recorded_at).getTime() - parseDate(b.recorded_at).getTime(),
    );
}

/**
 * What do we actually know from real readings for this calendar month?
 * Returns null if there isn't enough data yet to derive any delta.
 */
export function getActualMonthProgress(
  readings: Reading[],
  monthKey: MonthKey,
): ActualMonthProgress | null {
  const sorted = sortedByDateAsc(readings);
  if (sorted.length === 0) return null;

  const start = monthStart(monthKey);
  const end = monthEnd(monthKey);

  const monthReadings = sorted.filter((r) => {
    const d = parseDate(r.recorded_at);
    return d >= start && d <= end;
  });
  if (monthReadings.length === 0) return null;

  // Baseline = last reading strictly before this month started, if any.
  const baseline = [...sorted]
    .reverse()
    .find((r) => parseDate(r.recorded_at) < start);

  const lastReading = monthReadings[monthReadings.length - 1];
  const effectiveStart = baseline ?? monthReadings[0];

  // No baseline and only one reading this month → no delta to measure yet.
  if (effectiveStart.id === lastReading.id) return null;

  const vtKwh = Math.max(
    (lastReading.vt as number) - (effectiveStart.vt as number),
    0,
  );
  const mtKwh = Math.max(
    (lastReading.mt as number) - (effectiveStart.mt as number),
    0,
  );
  const daysElapsed = Math.max(
    dateDiffDays(
      parseDate(effectiveStart.recorded_at),
      parseDate(lastReading.recorded_at),
    ),
    1,
  );

  return {
    vtKwh,
    mtKwh,
    daysElapsed,
    lastReadingDate: lastReading.recorded_at,
  };
}

/**
 * Recent daily pace, from a rolling window of the last few days of
 * readings (falls back to whatever the single most recent interval is,
 * however old, if there isn't enough recent history — including
 * reaching back across a month boundary, e.g. day 1-2 of a new month).
 */
export function deriveRunRate(
  readings: Reading[],
  windowDays: number = ROLLING_WINDOW_DAYS,
): RunRate | null {
  const sorted = sortedByDateAsc(readings);
  if (sorted.length < 2) return null;

  const latest = sorted[sorted.length - 1];
  const latestDate = parseDate(latest.recorded_at);
  const windowStart = new Date(latestDate);
  windowStart.setDate(windowStart.getDate() - windowDays);

  // Walk backwards while readings still fall inside the window;
  // default to just the immediately preceding reading (last interval).
  let ref = sorted[sorted.length - 2];
  for (let i = sorted.length - 2; i >= 0; i--) {
    if (parseDate(sorted[i].recorded_at) >= windowStart) {
      ref = sorted[i];
    } else {
      break;
    }
  }

  const days = dateDiffDays(parseDate(ref.recorded_at), latestDate);
  if (days <= 0) return null; // same-day readings — can't derive a safe rate

  const vtPerDay = Math.max(
    ((latest.vt as number) - (ref.vt as number)) / days,
    0,
  );
  const mtPerDay = Math.max(
    ((latest.mt as number) - (ref.mt as number)) / days,
    0,
  );

  return {
    vtPerDay,
    mtPerDay,
    source: days >= windowDays ? "rolling_average" : "last_interval",
    basedOnDays: days,
  };
}

const EMPTY_OUTLOOK_BASE = {
  actual: null,
  runRate: null,
  projectedRemainingVt: 0,
  projectedRemainingMt: 0,
  totalEstimatedVt: 0,
  totalEstimatedMt: 0,
  bill: null,
} as const;

/**
 * The combined picture: real data where it exists, projected for
 * whatever's left of the month, fed through the existing calculateBill().
 */
export function buildMonthOutlook(
  readings: Reading[],
  monthKey: MonthKey,
  rates: TariffRates = DEFAULT_RATES,
  approvedKw: number = 3.3,
): MonthOutlook {
  const totalDaysInMonth = daysInMonth(monthKey);
  const actual = getActualMonthProgress(readings, monthKey);
  const runRate = deriveRunRate(readings);

  if (!actual && !runRate) {
    return {
      monthKey,
      daysInMonth: totalDaysInMonth,
      confidence: "insufficient_data",
      ...EMPTY_OUTLOOK_BASE,
    };
  }

  const daysElapsed = actual?.daysElapsed ?? 0;
  const daysRemaining = Math.max(totalDaysInMonth - daysElapsed, 0);

  const projectedRemainingVt = runRate ? runRate.vtPerDay * daysRemaining : 0;
  const projectedRemainingMt = runRate ? runRate.mtPerDay * daysRemaining : 0;

  const totalEstimatedVt = (actual?.vtKwh ?? 0) + projectedRemainingVt;
  const totalEstimatedMt = (actual?.mtKwh ?? 0) + projectedRemainingMt;

  const bill = calculateBill(
    totalEstimatedVt,
    totalEstimatedMt,
    approvedKw,
    rates,
  );

  let confidence: MonthOutlook["confidence"];
  if (actual && daysRemaining === 0) {
    confidence = "measured";
  } else if (actual || runRate) {
    confidence = "projected";
  } else {
    confidence = "insufficient_data";
  }

  return {
    monthKey,
    daysInMonth: totalDaysInMonth,
    actual,
    runRate,
    projectedRemainingVt,
    projectedRemainingMt,
    totalEstimatedVt,
    totalEstimatedMt,
    bill,
    confidence,
  };
}
