"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/db";

function friendlyError(msg: string): string {
  if (msg.includes("duplicate key")) return "Ovaj podatak već postoji.";
  if (msg.includes("violates row-level security")) return "Nemate dozvolu za ovu operaciju.";
  if (msg.includes("foreign key constraint")) return "Povezani podatak ne postoji.";
  return msg;
}

function metersRedirect(error: string): never {
  const params = new URLSearchParams({ error });
  redirect(`/?${params.toString()}`);
}

export async function createMeterAction(formData: FormData) {
  const user = await getAuthUser();
  if (!user) metersRedirect("Niste prijavljeni.");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) metersRedirect("Naziv brojila je obavezan.");
  if (name.length > 200) metersRedirect("Naziv brojila je predug (maks. 200 znakova).");

  const approved_kw = parseFloat(String(formData.get("approved_kw") ?? "3.3"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!Number.isFinite(approved_kw) || approved_kw <= 0) {
    metersRedirect("Odobrena snaga mora biti pozitivan broj.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("meters").insert({
    user_id: user.id,
    name,
    tariff_group: "TG2",
    approved_kw,
    notes,
  });
  if (error) metersRedirect(`Spremanje neuspješno: ${friendlyError(error.message)}`);

  revalidatePath("/");
  redirect("/");
}

export async function deleteMeterAction(formData: FormData) {
  const user = await getAuthUser();
  if (!user) metersRedirect("Niste prijavljeni.");
  const id = String(formData.get("id") ?? "");
  if (!id) metersRedirect("ID brojila nedostaje.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("meters")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) metersRedirect(`Brisanje neuspješno: ${friendlyError(error.message)}`);

  revalidatePath("/");
  redirect("/");
}
