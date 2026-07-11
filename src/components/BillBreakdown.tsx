import type { BlockBreakdown } from "@/lib/tariff";

export function BlockColor(label: string): string {
  if (label.includes("I ")) return "var(--success)";
  if (label.includes("II ")) return "var(--accent-strong)";
  return "var(--danger)";
}

export function BillBreakdown({
  blocks,
  approved_kw,
  mjernoMjesto,
  obracunskaSnaga,
  totalEnergy,
  totalOie,
  subtotal,
  vatAmount,
  total,
  consumptionKwh,
  isPartialObračun,
}: {
  blocks: BlockBreakdown[];
  approved_kw: number;
  mjernoMjesto: number;
  obracunskaSnaga: number;
  totalEnergy: number;
  totalOie: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  consumptionKwh: number;
  isPartialObračun?: boolean;
}) {
  return (
    <div className="mt-5 rounded-lg border border-[color:color-mix(in_srgb,var(--accent-strong)_30%,transparent)] bg-black/30 p-5">
      <div className="text-xs uppercase tracking-widest text-[var(--accent-strong)] mb-4">
        📄 Obračun — {consumptionKwh.toFixed(2)} kWh
      </div>

      {blocks.length > 0 && (
        <div className="flex gap-1 h-1.5 rounded-sm overflow-hidden mb-3">
          {blocks.map((b, i) => (
            <div
              key={i}
              className="h-full"
              style={{ flex: b.kwh, background: BlockColor(b.label) }}
              title={b.label}
            />
          ))}
        </div>
      )}

      <div className="mb-4">
        {blocks.map((b, i) => (
          <div
            key={i}
            className="flex justify-between text-xs py-1 text-[var(--fg-dim)]"
          >
            <span style={{ color: BlockColor(b.label) }}>■ {b.label}</span>
            <span>
              {b.kwh.toFixed(2)} kWh × {b.rate.toFixed(4)} = {b.cost.toFixed(2)} KM
            </span>
          </div>
        ))}
      </div>

      {!isPartialObračun && (
        <>
          <Row label="Mjerno mjesto" value={`${mjernoMjesto.toFixed(2)} KM`} />
          <Row
            label={`Obračunska snaga (${approved_kw} kW)`}
            value={`${obracunskaSnaga.toFixed(2)} KM`}
          />
        </>
      )}
      <Row label="Aktivna energija" value={`${totalEnergy.toFixed(2)} KM`} />
      <Row label="Naknada OIE" value={`${totalOie.toFixed(2)} KM`} />
      {isPartialObračun ? (
        <div className="text-[11px] text-[var(--warn)] py-2 border-b border-[var(--surface-2)] italic">
          * Ostale stavke (Mjerno mjesto, Obračunska snaga, PDV) nisu uključene jer obračunski period iznosi manje od 29 dana (nije puni mjesečni obračun).
        </div>
      ) : (
        <>
          <Row label="Osnovica (bez PDV)" value={`${subtotal.toFixed(2)} KM`} muted />
          <Row label="PDV (17%)" value={`${vatAmount.toFixed(2)} KM`} muted last />
        </>
      )}

      <div className="flex justify-between items-center pt-3 mt-2 border-t border-[var(--border)]">
        <span className="text-sm font-bold text-[color:color-mix(in_srgb,var(--accent-strong)_70%,white)]">
          UKUPNO SA PDV
        </span>
        <span className="text-2xl font-bold text-[var(--fg-strong)]">
          {total.toFixed(2)} KM
        </span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  last,
}: {
  label: string;
  value: string;
  muted?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center py-1.5 text-[13px] ${
        last ? "border-b border-[var(--border)]" : "border-b border-[var(--surface-2)]"
      } ${muted ? "text-[var(--fg-dim)] text-xs" : ""}`}
    >
      <span className={muted ? "" : "text-[var(--fg-mute)]"}>{label}</span>
      <span className={muted ? "" : "font-semibold text-[var(--fg)]"}>{value}</span>
    </div>
  );
}
