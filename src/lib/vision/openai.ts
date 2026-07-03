import type { VisionProvider, ExtractResult, VisionConfig } from "./types";
import { buildPrompt } from "./types";

export function createOpenAIProvider(config: VisionConfig): VisionProvider {
  const model = config.model ?? "gpt-4o";
  const apiKey = config.apiKey;
  const baseUrl = "https://api.openai.com/v1/chat/completions";

  return {
    async extract(base64, mediaType, tariffGroup): Promise<ExtractResult> {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: `data:${mediaType};base64,${base64}` },
                },
                { type: "text", text: buildPrompt(tariffGroup) },
              ],
            },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`OpenAI API error (${res.status}): ${body}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content ?? "";
      const clean = text.replace(/```json|```/g, "").trim();
      return JSON.parse(clean) as ExtractResult;
    },
  };
}
