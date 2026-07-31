import Link from "next/link";
import { Great_Vibes } from "next/font/google";
import { signOutAction } from "@/app/actions/auth";
import { getAuthUser } from "@/lib/db";
import { HeaderSettings } from "./HeaderSettings";

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export default async function Header() {
  const user = await getAuthUser();
  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <span
            className={`${greatVibes.className} text-[var(--fg-strong)]`}
          >
            Struja
          </span>
        </Link>
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-xs text-[var(--fg-mute)] hidden sm:inline">
              {user.email}
            </span>
            <HeaderSettings />
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-xs uppercase tracking-widest text-[var(--fg-dim)] hover:text-[var(--fg-strong)] cursor-pointer"
              >
                Odjava
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-xs uppercase tracking-widest text-[var(--accent-strong)] hover:text-[var(--fg-strong)]"
          >
            Prijava
          </Link>
        )}
      </div>
    </header>
  );
}
