import type { VisionConfig, VisionProvider, ExtractResult } from "./types";
import { buildPrompt } from "./types";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

function defaultModel(provider: string | undefined): string {
  if (provider) return provider;
  return "gemini-2.5-flash";
}

export function createGoogleProvider(config: VisionConfig): VisionProvider {
  const model = defaultModel(config.model);

  async function extract(
    base64: string,
    mediaType: string,
    tariffGroup: "TG1" | "TG2",
  ): Promise<ExtractResult> {
    const prompt = buildPrompt(tariffGroup);

    const body = {
      contents: [
        {
          parts: [
            { inlineData: { mimeType: mediaType, data: base64 } },
            { text: prompt },
          ],
        },
      ],
    };

    const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${config.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${errText}`);
    }

    const data = await res.json();

    const text: string | undefined =
      data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return {
        confidence: "low",
        note: "No text returned from Gemini. The model may have been blocked.",
      };
    }

    const cleaned = text
      .replace(/```(?:json)?/gi, "")
      .replace(/```/g, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned) as ExtractResult;
      return {
        reading: parsed.reading,
        vt: parsed.vt,
        mt: parsed.mt,
        confidence: parsed.confidence ?? "low",
        note: parsed.note,
      };
    } catch {
      return {
        confidence: "low",
        note: `Gemini returned unparseable JSON: ${text.slice(0, 300)}`,
      };
    }
  }

  return { extract };
}
