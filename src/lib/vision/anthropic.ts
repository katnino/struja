import type { VisionProvider, ExtractResult, VisionConfig } from "./types";
import { buildPrompt } from "./types";

export function createAnthropicProvider(config: VisionConfig): VisionProvider {
  const model = config.model ?? "claude-sonnet-4-20250514";
  const apiKey = config.apiKey;
  const baseUrl = "https://api.anthropic.com/v1/messages";

  return {
    async extract(base64, mediaType, tariffGroup): Promise<ExtractResult> {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: { type: "base64", media_type: mediaType, data: base64 },
                },
                { type: "text", text: buildPrompt(tariffGroup) },
              ],
            },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Anthropic API error (${res.status}): ${body}`);
      }

      const data = await res.json();
      const textBlock = data.content?.find((b: Record<string, unknown>) => b.type === "text");
      const text = (textBlock?.text as string) ?? "";
      const clean = text.replace(/```json|```/g, "").trim();
      return JSON.parse(clean) as ExtractResult;
    },
  };
}
