export type VisionProviderName = "anthropic" | "openai";

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
    tariffGroup: "TG1" | "TG2"
  ): Promise<ExtractResult>;
}

export function buildPrompt(tariffGroup: "TG1" | "TG2"): string {
  return tariffGroup === "TG1"
    ? `This is a photo of a single-tariff (jednotarifna) electricity meter. Extract the main kWh reading shown on the display or dial. Return ONLY a JSON object like: {"reading": 12345.6, "confidence": "high", "note": "optional note"}. If you cannot read it clearly, set confidence to "low" and explain in note.`
    : `This is a photo of a dual-tariff (dvotarifna) electricity meter. Extract both readings: VT (Viša tarifa / peak) and MT (Manja tarifa / off-peak). Return ONLY a JSON object like: {"vt": 8234.5, "mt": 5123.1, "confidence": "high", "note": "optional note"}. If you cannot read clearly, set confidence to "low".`;
}
