import { NextResponse } from "next/server";
import { fetchTariffRates, getAuthUser } from "@/lib/db";

// Public read of the currently-effective REERS rates. Useful for other
// clients that might want to compute a bill locally (e.g. mobile app).
export async function GET() {
  const [user, rates] = await Promise.all([getAuthUser(), fetchTariffRates()]);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(rates);
}
