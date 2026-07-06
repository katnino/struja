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
