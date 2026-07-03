import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import { fetchMeter, fetchLatestReading, fetchTariffRates } from "@/lib/db";
import { formatReading } from "@/lib/format";
import { ReadingFormClient } from "./ReadingFormClient";

export default async function NewReadingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meter = await fetchMeter(id);
  if (!meter) notFound();

  const [prevReading, rates] = await Promise.all([
    fetchLatestReading(meter.id),
    fetchTariffRates(),
  ]);

  const prevValues = prevReading
    ? {
        reading: prevReading.reading ?? undefined,
        vt: prevReading.vt ?? undefined,
        mt: prevReading.mt ?? undefined,
      }
    : { reading: undefined, vt: undefined, mt: undefined };

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-4 text-xs text-[var(--fg-dim)]">
          <Link href={`/meters/${meter.id}`} className="hover:text-[var(--fg-strong)]">
            ← Natrag na brojilo
          </Link>
        </div>

        <div className="border-b border-[var(--border)] pb-4 mb-6">
          <h2 className="text-lg font-bold tracking-wider text-[var(--fg-strong)]">
            ⚡ Novo očitanje
          </h2>
          <p className="text-[11px] text-[var(--fg-dim)] uppercase tracking-widest mt-1">
            {meter.name} · {meter.tariff_group} · {Number(meter.approved_kw)} kW
          </p>
        </div>

        {prevReading ? (
          <div className="border border-[var(--border)] rounded p-3 mb-5 text-xs bg-[var(--surface)]">
            <span className="text-[var(--fg-dim)] uppercase tracking-widest mr-2">
              Prethodno stanje ({prevReading.recorded_at}):
            </span>
            <span className="text-[var(--fg-strong)]">
              {formatReading(prevReading, meter.tariff_group)}
            </span>
          </div>
        ) : (
          <div className="border border-dashed border-[var(--warn)] rounded p-3 mb-5 text-xs bg-[color:color-mix(in_srgb,var(--warn)_8%,transparent)] text-[var(--warn)]">
            ⚠ Ovo je prvo očitanje. Račun se neće generirati; ovo očitanje postaje
            polazište za idući mjesec.
          </div>
        )}

        <Suspense fallback={null}>
          <ReadingFormClient
            meterId={meter.id}
            tariffGroup={meter.tariff_group}
            prev={prevValues}
            approvedKw={Number(meter.approved_kw)}
            rates={rates}
          />
        </Suspense>
      </main>
    </>
  );
}
