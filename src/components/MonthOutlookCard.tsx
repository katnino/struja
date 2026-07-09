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

function blockColor(label: string): string {
  if (label.includes("I ")) return "#22c55e";  // bright green
  if (label.includes("II ")) return "#f97316";  // orange
  return "#ef4444";  // bright red
}

export function MonthOutlookCard({ outlook }: { outlook: MonthOutlook }) {
  const monthLabel = MONTH_NAMES[outlook.monthKey.month - 1];

  if (outlook.confidence === "insufficient_data") {
    return (
      <div className="border border-[var(--border-strong)] rounded-lg p-4 mb-6 text-center">
	        <p className="text-[11px] uppercase tracking-widest text-[var(--fg-mute)] mb-1">
	          📈 Procjena za {monthLabel}
	        </p>
	        <p className="text-xs text-[var(--fg-dim)]">
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
    <div className="border border-[var(--border)] rounded-lg p-4 mb-6 bg-[var(--surface)]">
	      <div className="flex items-center justify-between mb-3">
	        <p className="text-[11px] uppercase tracking-widest text-[var(--fg-mute)]">
	          {confidence === "measured" ? "📊 Mjesec" : "📈 Procjena"} ·{" "}
	          {monthLabel}
	        </p>
	        {topBlock && (
	          <span
	            className="text-[10px] uppercase tracking-widest"
	            style={{ color: blockColor(topBlock.label) }}
	          >
	            {topBlock.label}
	          </span>
	        )}
	      </div>

	      <div className="text-xl font-bold text-[var(--fg-strong)] mb-1">
	        ~{totalKwh.toFixed(0)} kWh
	        {bill && (
	          <span className="text-sm font-normal text-[var(--fg-mute)] ml-2">
	            · ~{bill.total.toFixed(2)} KM
	          </span>
	        )}
	      </div>

	      {confidence === "projected" ? (
	        <p className="text-[11px] text-[var(--fg-dim)]">
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
	        <p className="text-[11px] text-[var(--fg-dim)]">
	          Kompletno izmjereno za ovaj mjesec
	        </p>
	      )}
	    </div>
  );
}
