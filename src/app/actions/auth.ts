"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function loginRedirect(next: string, error: string) {
  const params = new URLSearchParams({ error, next });
  redirect(`/login?${params.toString()}`);
}

function signupRedirect(error: string) {
  const params = new URLSearchParams({ error });
  redirect(`/signup?${params.toString()}`);
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/") || "/";

  if (!email || !password) loginRedirect(next, "Email i lozinka su obavezni.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email!, password: password! });
  if (error) loginRedirect(next, `Prijava neuspješna: ${error.message}`);

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) signupRedirect("Email i lozinka su obavezni.");
  if (password.length < 6) signupRedirect("Lozinka mora imati najmanje 6 znakova.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email: email!, password: password! });
  if (error) signupRedirect(`Registracija neuspješna: ${error.message}`);

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
