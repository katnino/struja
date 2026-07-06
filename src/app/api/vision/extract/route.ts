import { NextResponse } from "next/server";
import { createVisionProvider } from "@/lib/vision/provider";
import { getAuthUser, fetchUserApiKey } from "@/lib/db";
import type { ExtractResult } from "@/lib/vision/types";

// Validate file size (5 MB max)
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user's own API key
  const apiKey = await fetchUserApiKey(user.id);
  if (!apiKey) {
    return NextResponse.json(
      { error: "NO_API_KEY", message: "Unesite svoj besplatni Gemini API ključ u postavkama." },
      { status: 403 }
    );
  }

  let body: { imageBase64?: string; mediaType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { imageBase64, mediaType } = body;

  if (!imageBase64 || !mediaType) {
    return NextResponse.json(
      { error: "Missing required fields: imageBase64, mediaType" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(mediaType)) {
    return NextResponse.json(
      { error: "Unsupported file type. Allowed: JPG, PNG, WEBP" },
      { status: 400 }
    );
  }

  // Estimated size (base64 is ~4/3 of binary)
  const estimatedBytes = (imageBase64.length * 3) / 4;
  if (estimatedBytes > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image too large. Maximum 5 MB." },
      { status: 400 }
    );
  }

  try {
    const provider = createVisionProvider({ provider: "google", apiKey });
    const result: ExtractResult = await provider.extract(
      imageBase64,
      mediaType,
    );

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Vision extract error:", message);
    return NextResponse.json(
      { error: `AI extraction failed: ${message}` },
      { status: 500 }
    );
  }
}
