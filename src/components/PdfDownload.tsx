"use client";

import type { BlockBreakdown } from "@/lib/tariff";

export function PdfDownload({
  meterName,
  periodStart,
  periodEnd,
  blocks,
  approvedKw,
  mjernoMjesto,
  obracunskaSnaga,
  totalEnergy,
  totalOie,
  subtotal,
  vatAmount,
  total,
  consumptionKwh,
}: {
  meterName: string;
  periodStart: string;
  periodEnd: string;
  blocks: BlockBreakdown[];
  approvedKw: number;
  mjernoMjesto: number;
  obracunskaSnaga: number;
  totalEnergy: number;
  totalOie: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  consumptionKwh: number;
}) {
  const handleDownload = async () => {
    const { jsPDF } = await import("jspdf");

    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = 190;
    const margin = 10;
    let y = margin;

    const title = (text: string, size: number) => {
      pdf.setFontSize(size);
      pdf.text(text, margin, y);
      y += size * 0.5;
    };

    const subtitle = (text: string) => {
      pdf.setFontSize(9);
      pdf.setTextColor(100);
      pdf.text(text, margin, y);
      y += 5;
      pdf.setTextColor(0);
    };

    const line = () => {
      y += 2;
      pdf.setDrawColor(200);
      pdf.line(margin, y, pageW + margin, y);
      y += 4;
    };

    const row = (label: string, value: string, bold = false) => {
      pdf.setFontSize(11);
      if (bold) pdf.setFont("helvetica", "bold");
      else pdf.setFont("helvetica", "normal");
      pdf.text(label, margin, y);
      pdf.text(value, pageW + margin, y, { align: "right" });
      y += 6;
    };

    // Header
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.text("⚡ Struja", margin, y);
    y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(`${meterName} · ${periodStart} → ${periodEnd}`, margin, y);
    y += 12;
    pdf.setTextColor(0);

    // Consumption
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(`Obračun — ${consumptionKwh.toFixed(2)} kWh`, margin, y);
    y += 8;

    line();

    // Blocks
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    for (const b of blocks) {
      const costStr = `${b.cost.toFixed(2)} KM`;
      pdf.text(`■ ${b.label}`, margin, y);
      pdf.text(
        `${b.kwh.toFixed(2)} kWh × ${b.rate.toFixed(4)} = ${costStr}`,
        pageW + margin,
        y,
        { align: "right" },
      );
      y += 6;
    }

    if (blocks.length > 0) y += 2;

    line();

    // Line items
    row("Mjerno mjesto", `${mjernoMjesto.toFixed(2)} KM`);
    row(`Obračunska snaga (${approvedKw} kW)`, `${obracunskaSnaga.toFixed(2)} KM`);
    row("Aktivna energija", `${totalEnergy.toFixed(2)} KM`);
    row("Naknada OIE", `${totalOie.toFixed(2)} KM`);
    y += 1;
    row("Osnovica (bez PDV)", `${subtotal.toFixed(2)} KM`);
    row("PDV (17%)", `${vatAmount.toFixed(2)} KM`);

    line();

    // Total
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("UKUPNO SA PDV", margin, y);
    pdf.text(`${total.toFixed(2)} KM`, pageW + margin, y, { align: "right" });
    y += 10;

    // Footer
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(180);
    pdf.text(
      "REERS odluka 15.12.2022 · primjena od 01.01.2023. · informativni obračun",
      margin,
      285,
    );

    pdf.save(`Struja-${periodStart}-${periodEnd}.pdf`);
  };

  return (
    <button
      onClick={handleDownload}
      className="flex-1 text-center py-3 rounded bg-[var(--surface-2)] hover:bg-[var(--border-strong)] text-[var(--fg)] uppercase tracking-widest text-xs font-bold cursor-pointer border border-[var(--border-strong)]"
    >
      Preuzmi PDF
    </button>
  );
}
