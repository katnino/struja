import type { Reading } from "@/lib/db";
import type { TariffGroup } from "@/lib/tariff";

export function formatReading(
  r: Pick<Reading, "reading" | "vt" | "mt">,
  group: TariffGroup
) {
  if (group === "TG1") {
    return `${r.reading?.toFixed(2) ?? "—"} kWh`;
  }
  return `VT ${r.vt?.toFixed(2) ?? "—"} · MT ${r.mt?.toFixed(2) ?? "—"} kWh`;
}
