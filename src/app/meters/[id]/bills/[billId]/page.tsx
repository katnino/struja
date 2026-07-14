import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { fetchBill, fetchMeter, fetchTariffRates } from "@/lib/db";
import { BillBreakdown } from "@/components/BillBreakdown";
import { PdfDownload } from "@/components/PdfDownload";
import { summarizeBlocks } from "@/lib/tariff";

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string; billId: string }>;
}) {
  const { id, billId } = await params;
  const [meter, bill, rates] = await Promise.all([
    fetchMeter(id),
    fetchBill(billId),
    fetchTariffRates(),
  ]);
  if (!meter || !bill || bill.meter_id !== meter.id) notFound();

  const periodStart = new Date(bill.period_start);
  const periodEnd = new Date(bill.period_end);
  const daysInPeriod = Math.round((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
  const isPartialObračun = daysInPeriod < 29;
  const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
  const summary = summarizeBlocks(bill.blocks);
  const serviceFee = rates.serviceFee;
  const transmissionBaseCost = summary.totalTransmission;
  const distributionBaseCost = summary.totalDistribution;
  const transmissionPowerFee = isPartialObračun ? 0 : Number(meter.approved_kw) * rates.powerFlatRate;
  const distributionPowerFee = isPartialObračun ? 0 : Number(meter.approved_kw) * rates.powerKwRate;
  const totalTransmission = roundMoney(transmissionBaseCost + transmissionPowerFee);
  const totalDistribution = roundMoney(distributionBaseCost + distributionPowerFee);
  const subtotal = roundMoney(serviceFee + summary.totalEnergy + totalTransmission + totalDistribution + summary.totalOie);
  const vatAmount = roundMoney(subtotal * rates.vat);
  const total = roundMoney(subtotal + vatAmount);

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
          mjernoMjesto={serviceFee}
          totalEnergy={summary.totalEnergy}
          transmissionBaseCost={transmissionBaseCost}
          totalTransmission={totalTransmission}
          distributionBaseCost={distributionBaseCost}
          totalDistribution={totalDistribution}
          totalOie={summary.totalOie}
          subtotal={subtotal}
          vatAmount={vatAmount}
          total={total}
          consumptionKwh={Number(bill.consumption_kwh)}
          isPartialObračun={isPartialObračun}
        />

        <div className="mt-4">
          <BillBreakdown
            blocks={bill.blocks}
            mjernoMjesto={serviceFee}
            totalEnergy={summary.totalEnergy}
            transmissionBaseCost={transmissionBaseCost}
            totalTransmission={totalTransmission}
            distributionBaseCost={distributionBaseCost}
            totalDistribution={totalDistribution}
            totalOie={summary.totalOie}
            subtotal={subtotal}
            vatAmount={vatAmount}
            total={total}
            consumptionKwh={Number(bill.consumption_kwh)}
            isPartialObračun={isPartialObračun}
          />
        </div>

        <div className="mt-6 text-[10px] text-[var(--fg-faint)] tracking-wider">
          REERS odluka 17.12.2024 · primjena od 01.06.2026. · informativni obračun
        </div>
      </main>
    </>
  );
}
