import type { VisionConfig, VisionProvider } from "./types";
import { createAnthropicProvider } from "./anthropic";
import { createOpenAIProvider } from "./openai";

export function createVisionProvider(config: VisionConfig): VisionProvider {
  switch (config.provider) {
    case "anthropic":
      return createAnthropicProvider(config);
    case "openai":
      return createOpenAIProvider(config);
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
  const provider = (process.env.VISION_PROVIDER ?? "anthropic") as VisionConfig["provider"];
  const apiKey = process.env.VISION_API_KEY ?? "";
  if (!apiKey) {
    throw new Error(
      "VISION_API_KEY is not set in .env.local. " +
      "Get one from https://console.anthropic.com/ or https://platform.openai.com/api-keys"
    );
  }
  return createVisionProvider({ provider, apiKey });
}
