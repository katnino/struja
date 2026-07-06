import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { fetchBill, fetchMeter } from "@/lib/db";
import { BillBreakdown } from "@/components/BillBreakdown";
import { PdfDownload } from "@/components/PdfDownload";

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string; billId: string }>;
}) {
  const { id, billId } = await params;
  const [meter, bill] = await Promise.all([fetchMeter(id), fetchBill(billId)]);
  if (!meter || !bill || bill.meter_id !== meter.id) notFound();

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
            📄 Račun
          </h2>
          <p className="text-[11px] text-[var(--fg-dim)] uppercase tracking-widest mt-1">
            {meter.name} · {bill.period_start} → {bill.period_end}
          </p>
        </div>

        <PdfDownload
          meterName={meter.name}
          periodStart={bill.period_start}
          periodEnd={bill.period_end}
          blocks={bill.blocks}
          approvedKw={Number(bill.approved_kw)}
          mjernoMjesto={Number(bill.mjerno_mjesto)}
          obracunskaSnaga={Number(bill.obracunska_snaga)}
          totalEnergy={Number(bill.energy_cost)}
          totalOie={Number(bill.oie_cost)}
          subtotal={Number(bill.subtotal)}
          vatAmount={Number(bill.vat_amount)}
          total={Number(bill.total)}
          consumptionKwh={Number(bill.consumption_kwh)}
        />

        <div className="mt-4">
          <BillBreakdown
            blocks={bill.blocks}
            approved_kw={Number(bill.approved_kw)}
            mjernoMjesto={Number(bill.mjerno_mjesto)}
            obracunskaSnaga={Number(bill.obracunska_snaga)}
            totalEnergy={Number(bill.energy_cost)}
            totalOie={Number(bill.oie_cost)}
            subtotal={Number(bill.subtotal)}
            vatAmount={Number(bill.vat_amount)}
            total={Number(bill.total)}
            consumptionKwh={Number(bill.consumption_kwh)}
          />
        </div>

        <div className="mt-6 text-[10px] text-[var(--fg-faint)] tracking-wider">
          REERS odluka 15.12.2022 · primjena od 01.01.2023. · informativni obračun
        </div>
      </main>
    </>
  );
}
