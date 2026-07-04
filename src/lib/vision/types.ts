export type VisionProviderName = "anthropic" | "openai" | "google";

export interface VisionConfig {
  provider: VisionProviderName;
  apiKey: string;
  model?: string;
}

export interface ExtractResult {
  reading?: number;
  vt?: number;
  mt?: number;
  confidence: "high" | "low";
  note?: string;
}

export interface VisionProvider {
  extract(
    base64: string,
    mediaType: string,
  ): Promise<ExtractResult>;
}

export function buildPrompt(): string {
  return `You are looking at a dual-tariff (dvotarifna) electricity meter.

LAYOUT — Two rows of digit wheels, one below the other, with "kWh" written between them:

  TOP ROW    = VT (Viša tarifa / peak)
  BOTTOM ROW = MT (Manja tarifa / off-peak)

Each row has 6 digit wheels:
  • 5 white/black main digits (the actual meter reading)
  • 1 red decimal digit slightly spaced to the right — IGNORE THIS

Extract ONLY the 5 main digits from each row as whole numbers (e.g. 82345, NOT 82345.6).

IGNORE all numbers below the rotating disc / impulse wheel (those are serial numbers, specs, model info — not meter readings).

Return JSON:
{"vt": 82345, "mt": 52341, "confidence": "high", "note": "optional note"}
If unclear, set confidence to "low" and explain which number was ambiguous.`;
}
