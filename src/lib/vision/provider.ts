import type { VisionConfig, VisionProvider } from "./types";
import { createAnthropicProvider } from "./anthropic";
import { createOpenAIProvider } from "./openai";
import { createGoogleProvider } from "./google";

export function createVisionProvider(config: VisionConfig): VisionProvider {
  switch (config.provider) {
    case "anthropic":
      return createAnthropicProvider(config);
    case "openai":
      return createOpenAIProvider(config);
    case "google":
      return createGoogleProvider(config);
    default: {
      const _exhaustive: never = config.provider;
      throw new Error(`Unknown vision provider: ${_exhaustive}`);
    }
  }
}

/**
 * Create a VisionProvider from environment variables.
 * Expects VISION_PROVIDER and VISION_API_KEY.
 */
export function createProviderFromEnv(): VisionProvider {
  const provider = (process.env.VISION_PROVIDER ?? "google") as VisionConfig["provider"];
  const apiKey = process.env.VISION_API_KEY ?? "";
  if (!apiKey) {
    throw new Error(
      "VISION_API_KEY is not set in .env.local. " +
      "Get a free Gemini key from https://aistudio.google.com/apikey"
    );
  }
  return createVisionProvider({ provider, apiKey });
}
