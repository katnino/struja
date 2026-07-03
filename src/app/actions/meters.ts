"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/db";
import type { TariffGroup } from "@/lib/tariff";

function metersRedirect(error: string) {
  const params = new URLSearchParams({ error });
  redirect(`/?${params.toString()}`);
}

export async function createMeterAction(formData: FormData) {
  const user = await getAuthUser();
  if (!user) metersRedirect("Niste prijavljeni.");

  const name = String(formData.get("name") ?? "").trim();
  const tariff_group = String(formData.get("tariff_group") ?? "TG1") as TariffGroup;
  const approved_kw = parseFloat(String(formData.get("approved_kw") ?? "3.3"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) metersRedirect("Naziv brojila je obavezan.");
  if (tariff_group !== "TG1" && tariff_group !== "TG2") {
    metersRedirect("Neispravna vrsta brojila.");
  }
  if (!Number.isFinite(approved_kw) || approved_kw <= 0) {
    metersRedirect("Odobrena snaga mora biti pozitivan broj.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("meters").insert({
    user_id: user!.id,
    name: name!,
    tariff_group: tariff_group!,
    approved_kw,
    notes,
  });
  if (error) metersRedirect(`Spremanje neuspješno: ${error.message}`);

  revalidatePath("/");
  redirect("/");
}

export async function deleteMeterAction(formData: FormData) {
  const user = await getAuthUser();
  if (!user) metersRedirect("Niste prijavljeni.");
  const id = String(formData.get("id") ?? "");
  if (!id) metersRedirect("ID brojila nedostaje.");

  const supabase = await createClient();
  const { error } = await supabase.from("meters").delete().eq("id", id);
  if (error) metersRedirect(`Brisanje neuspješno: ${error.message}`);

  revalidatePath("/");
  redirect("/");
}
