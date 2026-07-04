import type { Reading } from "@/lib/db";

export function formatReading(
  r: Pick<Reading, "vt" | "mt">,
) {
  return `VT ${r.vt?.toFixed(0) ?? "—"} · MT ${r.mt?.toFixed(0) ?? "—"} kWh`;
}
