"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser, saveUserApiKey } from "@/lib/db";
import { createVisionProvider } from "@/lib/vision/provider";

export async function saveAiApiKeyAction(key: string) {
  const user = await getAuthUser();
  if (!user) return { error: "Niste prijavljeni." };

  const trimmed = key.trim();
  if (!trimmed) return { error: "API ključ ne može biti prazan." };

  // Validate: make a minimal Gemini call with this key
  try {
    const provider = createVisionProvider({
      provider: "google",
      apiKey: trimmed,
    });
    // Use a tiny prompt to validate — Gemini returns quickly
    const testResult = await provider.extract(
      // 1-pixel transparent PNG as base64 — minimal payload
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "image/png",
    );
    // If we get here without throwing, the key is valid
    console.log("AI key validation result:", testResult);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("403") || msg.includes("API_KEY_INVALID") || msg.includes("not found")) {
      return { error: "Ključ nije ispravan. Provjerite da ste kopirali ispravan Gemini API ključ." };
    }
    // Network error etc. — still save, might work later
    console.warn("AI key validation warning:", msg);
  }

  try {
    await saveUserApiKey(user.id, trimmed);
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return { error: `Spremanje neuspješno: ${err instanceof Error ? err.message : "Nepoznata greška"}` };
  }
}
