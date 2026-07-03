import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Use inside React Server Components, Server Actions, and API route handlers.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component (read-only cookies). Safe to ignore
            // because Next.js will refresh session on its own.
          }
        },
      },
    }
  );
}
