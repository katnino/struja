import Link from "next/link";
import Header from "@/components/Header";
import { fetchMeters, fetchLatestReading, fetchBills } from "@/lib/db";
import { createMeterAction } from "@/app/actions/meters";

export const metadata = { title: "Pregled – Struja" };

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const meters = await fetchMeters();
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 pb-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold tracking-widest text-[var(--fg-strong)] mb-1">
            Moja brojila
          </h2>
          <p className="text-[11px] text-[var(--fg-dim)] uppercase tracking-widest">
            REERS Odluka 15.12.2022 · primjena od 01.01.2023.
          </p>
        </div>

        {error && (
          <div className="border border-[var(--border)] rounded p-3 mb-5 bg-[color:color-mix(in_srgb,var(--danger)_15%,transparent)] text-[var(--danger)] text-xs">
            ⚠ {error}
          </div>
        )}

        {meters.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3 mb-8">
            {await Promise.all(
              meters.map(async meter => {
                const last = await fetchLatestReading(meter.id);
                const bills = await fetchBills(meter.id);
                return (
                  <MeterRow
                    key={meter.id}
                    id={meter.id}
                    name={meter.name}
                    kw={Number(meter.approved_kw)}
                    last={last}
                    billsCount={bills.length}
                  />
                );
              })
            )}
          </div>
        )}

        <AddMeterForm />
      </main>
    </>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-[var(--border-strong)] rounded-lg p-10 text-center mb-8">
      <div className="text-4xl mb-3">🪛</div>
      <h3 className="text-sm font-bold tracking-wider text-[var(--fg-strong)] mb-1">
        NEMAS NI JEDNO BROJILO
      </h3>
      <p className="text-xs text-[var(--fg-dim)]">
        Dodaj prvo brojilo ispod da bi počeo sa praćenjem potrošnje.
      </p>
    </div>
  );
}

function MeterRow({
  id,
  name,
  kw,
  last,
  billsCount,
}: {
  id: string;
  name: string;
  kw: number;
  last: { recorded_at: string; reading: number | null; vt: number | null; mt: number | null } | null;
  billsCount: number;
}) {
  const readingLabel =
    last == null
      ? "—"
      : `VT ${last.vt?.toFixed(0) ?? "?"} · MT ${last.mt?.toFixed(0) ?? "?"}`;
  return (
    <Link
      href={`/meters/${id}`}
      className="block border border-[var(--border)] rounded-lg p-4 bg-[var(--surface)] hover:border-[var(--accent-strong)] transition"
    >
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-sm font-bold text-[var(--fg-strong)]">{name}</h3>
        <span className="text-[10px] uppercase tracking-widest text-[var(--fg-dim)]">
          {kw} kW
        </span>
      </div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-[var(--fg-mute)]">
          Zadnje stanje:{" "}
          <span className="text-[var(--fg)]">{readingLabel}</span>{" "}
          {last && <span className="text-[var(--fg-faint)]">· {last.recorded_at}</span>}
        </span>
        <span className="text-[var(--fg-dim)]">{billsCount} računa</span>
      </div>
    </Link>
  );
}

function AddMeterForm() {
  return (
    <form
      action={createMeterAction}
      className="border border-[var(--border)] rounded-lg p-6 bg-[var(--surface)] space-y-4"
    >
      <h3 className="text-[11px] uppercase tracking-widest text-[var(--fg-mute)]">
        ➕ Dodaj brojilo
      </h3>
      <div>
        <label className="block text-[11px] uppercase tracking-widest text-[var(--fg-mute)] mb-1.5">
          Naziv (npr. &ldquo;Stan – kuhinja&rdquo;)
        </label>
        <input
          name="name"
          required
          className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border-strong)] rounded text-[var(--fg-strong)] outline-none focus:border-[var(--accent-strong)]"
        />
      </div>
      <div>
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-[var(--fg-mute)] mb-1.5">
            Odobrena snaga (kW)
          </label>
          <select
            name="approved_kw"
            defaultValue="3.3"
            className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border-strong)] rounded text-[var(--fg-strong)] outline-none focus:border-[var(--accent-strong)]"
          >
            {["3.3", "4.4", "5.5", "6.6", "8.8", "11.0"].map(v => (
              <option key={v} value={v}>
                {v} kW
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        className="w-full py-3 rounded bg-[var(--accent)] hover:opacity-90 text-white uppercase tracking-widest text-xs font-bold cursor-pointer"
      >
        Spremi brojilo
      </button>
    </form>
  );
}
