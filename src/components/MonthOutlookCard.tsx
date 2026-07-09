import type { MonthOutlook } from "@/lib/outlook";

const MONTH_NAMES = [
  "januar",
  "februar",
  "mart",
  "april",
  "maj",
  "juni",
  "juli",
  "august",
  "septembar",
  "oktobar",
  "novembar",
  "decembar",
];

export function MonthOutlookCard({ outlook }: { outlook: MonthOutlook }) {
  const monthLabel = MONTH_NAMES[outlook.monthKey.month - 1];

  if (outlook.confidence === "insufficient_data") {
    return (
      <div className="border border-border-strong rounded-lg p-4 mb-6 text-center">
        <p className="text-11px uppercase tracking-widest text-fg-mute mb-1">
          📈 Procjena za {monthLabel}
        </p>
        <p className="text-xs text-fg-dim">
          Nema dovoljno očitanja za procjenu. Dodaj još jedno očitanje.
        </p>
      </div>
    );
  }

  const {
    actual,
    runRate,
    totalEstimatedVt,
    totalEstimatedMt,
    bill,
    confidence,
  } = outlook;
  const totalKwh = totalEstimatedVt + totalEstimatedMt;
  const actualKwh = actual ? actual.vtKwh + actual.mtKwh : 0;
  const projectedKwh = totalKwh - actualKwh;

  const topBlock = bill?.blocks[bill.blocks.length - 1];

  return (
    <div className="border border-border rounded-lg p-4 mb-6 bg-surface">
      <div className="flex items-center justify-between mb-3">
        <p className="text-11px uppercase tracking-widest text-fg-mute">
          {confidence === "measured" ? "📊 Mjesec" : "📈 Procjena"} ·{" "}
          {monthLabel}
        </p>
        {topBlock && (
          <span className="text-10px uppercase tracking-widest text-accent-strong">
            {topBlock.label}
          </span>
        )}
      </div>

      <div className="text-xl font-bold text-fg-strong mb-1">
        ~{totalKwh.toFixed(0)} kWh
        {bill && (
          <span className="text-sm font-normal text-fg-mute ml-2">
            · ~{bill.total.toFixed(2)} KM
          </span>
        )}
      </div>

      {confidence === "projected" ? (
        <p className="text-11px text-fg-dim">
          {actualKwh.toFixed(0)} kWh izmjereno + ~{projectedKwh.toFixed(0)} kWh
          projektovano
          {runRate && (
            <>
              {" "}
              · tempo ~{(runRate.vtPerDay + runRate.mtPerDay).toFixed(1)}{" "}
              kWh/dan
            </>
          )}
        </p>
      ) : (
        <p className="text-11px text-fg-dim">
          Kompletno izmjereno za ovaj mjesec
        </p>
      )}
    </div>
  );
}
