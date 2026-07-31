import { signInAction } from "@/app/actions/auth";
import { Great_Vibes } from "next/font/google";

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = { title: "Prijava – Struja" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const next = params?.next ?? "/";
  const error = params?.error;
  const message = params?.message;
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">⚡</div>
          <h1 className={`${greatVibes.className} text-2xl text-[var(--fg-strong)]`}>
            Struja
          </h1>
          <p className="text-xs text-[var(--fg-dim)] mt-1 uppercase tracking-widest">
            Prijava
          </p>
        </div>

        <form
          action={signInAction}
          className="border border-[var(--border)] rounded-lg p-6 bg-[var(--surface)] space-y-4"
        >
          {error && (
            <div className="text-sm text-[var(--danger)] bg-[color:color-mix(in_srgb,var(--danger)_15%,transparent)] border border-[color:color-mix(in_srgb,var(--danger)_40%,transparent)] rounded p-3">
              {error}
            </div>
          )}
          {message && (
            <div className="text-sm text-[var(--info)] bg-[color:color-mix(in_srgb,var(--info)_15%,transparent)] border border-[color:color-mix(in_srgb,var(--info)_40%,transparent)] rounded p-3">
              {message}
            </div>
          )}
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-[var(--fg-mute)] mb-1.5">
              Email
            </label>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-3 py-2.5 bg-[var(--bg)] border border-[var(--border-strong)] rounded text-[var(--fg-strong)] outline-none focus:border-[var(--accent-strong)]"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-[var(--fg-mute)] mb-1.5">
              Lozinka
            </label>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-3 py-2.5 bg-[var(--bg)] border border-[var(--border-strong)] rounded text-[var(--fg-strong)] outline-none focus:border-[var(--accent-strong)]"
            />
          </div>
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            className="w-full py-3 rounded bg-[var(--accent)] hover:opacity-90 text-white uppercase tracking-widest text-xs font-bold cursor-pointer"
          >
            Prijava
          </button>
        </form>
      </div>
    </main>
  );
}
