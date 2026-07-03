import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { fetchMeter, fetchReadings, fetchBills } from "@/lib/db";
import { deleteMeterAction } from "@/app/actions/meters";
import { formatReading } from "@/lib/format";

export default async function MeterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meter = await fetchMeter(id);
  if (!meter) notFound();

  const [readings, bills] = await Promise.all([
    fetchReadings(meter.id),
    fetchBills(meter.id),
  ]);

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-4 text-xs text-[var(--fg-dim)]">
          <Link href="/" className="hover:text-[var(--fg-strong)]">← Sva brojila</Link>
        </div>

        <div className="border-b border-[var(--border)] pb-4 mb-6">
          <h2 className="text-lg font-bold tracking-wider text-[var(--fg-strong)]">
            {meter.name}
          </h2>
          <p className="text-[11px] text-[var(--fg-dim)] uppercase tracking-widest mt-1">
            {meter.tariff_group} · {Number(meter.approved_kw)} kW
          </p>
        </div>

        <div className="flex gap-3 mb-8">
          <Link
            href={`/meters/${meter.id}/readings/new`}
            className="flex-1 text-center py-3 rounded bg-[var(--accent)] hover:opacity-90 text-white uppercase tracking-widest text-xs font-bold"
          >
            ⚡ Novo očitanje
          </Link>
        </div>

        <Section title="Očitanja">
          {readings.length === 0 ? (
            <Empty msg="Još nema očitanja. Dodaj prvo da bi izračunao prvi račun." />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {readings.map(r => (
                <li key={r.id} className="py-3 flex justify-between items-baseline">
                  <div>
                    <div className="text-sm text-[var(--fg-strong)]">
                      {formatReading(r, meter.tariff_group)}
                    </div>
                    <div className="text-[11px] text-[var(--fg-dim)] uppercase tracking-widest mt-0.5">
                      {r.source}
                      {r.confidence ? ` · ${r.confidence}` : ""}
                    </div>
                  </div>
                  <span className="text-xs text-[var(--fg-mute)]">{r.recorded_at}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Računi">
          {bills.length === 0 ? (
            <Empty msg="Nema računa. Drugi i svaki sljedeći mjesec dodaj novo očitanje da se izračuna račun." />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {bills.map(b => (
                <li key={b.id} className="py-3">
                  <Link
                    href={`/meters/${meter.id}/bills/${b.id}`}
                    className="flex justify-between items-baseline hover:text-[var(--accent-strong)]"
                  >
                    <span className="text-xs text-[var(--fg-mute)]">
                      {b.period_start} → {b.period_end}
                    </span>
                    <span className="text-sm font-bold text-[var(--fg-strong)]">
                      {Number(b.total).toFixed(2)} KM
                    </span>
                  </Link>
                  <div className="text-[11px] text-[var(--fg-dim)] mt-0.5">
                    {Number(b.consumption_kwh).toFixed(2)} kWh
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <form action={deleteMeterAction} className="mt-10 pt-6 border-t border-[var(--border)]">
          <input type="hidden" name="id" value={meter.id} />
          <button
            type="submit"
            className="text-xs uppercase tracking-widest text-[var(--fg-faint)] hover:text-[var(--danger)] cursor-pointer"
          >
            Obriši brojilo (i sve račune)
          </button>
        </form>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h3 className="text-[11px] uppercase tracking-widest text-[var(--fg-mute)] mb-3">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="border border-dashed border-[var(--border-strong)] rounded p-6 text-center text-xs text-[var(--fg-dim)]">
      {msg}
    </div>
  );
}
