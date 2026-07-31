"use client";

import type { BlockBreakdown } from "@/lib/tariff";

const FONTS = {
  greatVibes: "/fonts/GreatVibes-Regular.ttf",
  body: "/fonts/PT_Sans-Web-Regular.ttf",
  bodyBold: "/fonts/PT_Sans-Web-Bold.ttf",
} as const;

async function fetchBase64(path: string): Promise<string> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Ne mogu učitati font: ${path}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function PdfDownload({
  meterName,
  periodStart,
  periodEnd,
  blocks,
  mjernoMjesto,
  totalEnergy,
  transmissionBaseCost,
  totalTransmission,
  distributionBaseCost,
  totalDistribution,
  totalOie,
  subtotal,
  vatAmount,
  total,
  consumptionKwh,
  isPartialObračun,
}: {
  meterName: string;
  periodStart: string;
  periodEnd: string;
  blocks: BlockBreakdown[];
  mjernoMjesto: number;
  totalEnergy: number;
  transmissionBaseCost: number;
  totalTransmission: number;
  distributionBaseCost: number;
  totalDistribution: number;
  totalOie: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  consumptionKwh: number;
  isPartialObračun?: boolean;
}) {
  const handleDownload = async () => {
    try {
      const { jsPDF } = await import("jspdf");

      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = 190;
      const margin = 10;
      let y = margin;

      const [greatVibes, bodyRegular, bodyBold] = await Promise.all([
        fetchBase64(FONTS.greatVibes),
        fetchBase64(FONTS.body),
        fetchBase64(FONTS.bodyBold),
      ]);
      pdf.addFileToVFS("GreatVibes-Regular.ttf", greatVibes);
      pdf.addFont("GreatVibes-Regular.ttf", "GreatVibes", "normal");
      pdf.addFileToVFS("PT_Sans-Web-Regular.ttf", bodyRegular);
      pdf.addFont("PT_Sans-Web-Regular.ttf", "pt-sans", "normal");
      pdf.addFileToVFS("PT_Sans-Web-Bold.ttf", bodyBold);
      pdf.addFont("PT_Sans-Web-Bold.ttf", "pt-sans", "bold");

      // Matches var(--danger) (#ef4444) used in the web UI
      const dangerColor: [number, number, number] = [239, 68, 68];

      const line = () => {
        y += 2;
        pdf.setDrawColor(200);
        pdf.line(margin, y, pageW + margin, y);
        y += 4;
      };

      const row = (
        label: string,
        value: string,
        bold = false,
        color?: [number, number, number],
      ) => {
        pdf.setFontSize(11);
        pdf.setFont("pt-sans", bold ? "bold" : "normal");
        if (color) pdf.setTextColor(...color);
        pdf.text(label, margin, y);
        pdf.text(value, pageW + margin, y, { align: "right" });
        if (color) pdf.setTextColor(0);
        y += 6;
      };

      // Header
      pdf.setFont("GreatVibes", "normal");
      pdf.setFontSize(28);
      pdf.text("Struja", margin, y);
      y += 10;
      pdf.setFont("pt-sans", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`${meterName} · ${periodStart} - ${periodEnd}`, margin, y);
      y += 12;
      pdf.setTextColor(0);

      // Consumption
      pdf.setFont("pt-sans", "bold");
      pdf.setFontSize(14);
      pdf.text(`Obračun — ${consumptionKwh.toFixed(2)} kWh`, margin, y);
      y += 8;

      line();

      // Blocks
      pdf.setFont("pt-sans", "normal");
      pdf.setFontSize(10);
      for (const b of blocks) {
        const costStr = `${b.activeEnergyCost.toFixed(2)} KM`;
        pdf.text(`• ${b.label}`, margin, y);
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

      // Line items — Mjerno mjesto / Obračunska snaga are always shown now;
      // they're just colored red when the period is partial (<29 days) to
      // indicate they weren't counted toward the total.
      row(
        "Mjerno mjesto",
        `${mjernoMjesto.toFixed(2)} KM`,
        false,
        isPartialObračun ? dangerColor : undefined,
      );
      row("Aktivna energija", `${totalEnergy.toFixed(2)} KM`);
      row("Prenosna mrežarina", `${totalTransmission.toFixed(2)} KM`);
      pdf.setFontSize(9);
      pdf.setTextColor(110);
      pdf.text(
        `${transmissionBaseCost.toFixed(2)} KM po kWh + ${(totalTransmission - transmissionBaseCost).toFixed(2)} KM po kW`,
        pageW + margin,
        y - 1,
        { align: "right" },
      );
      pdf.setTextColor(0);
      row("Distributivna mrežarina", `${totalDistribution.toFixed(2)} KM`);
      pdf.setFontSize(9);
      pdf.setTextColor(110);
      pdf.text(
        `${distributionBaseCost.toFixed(2)} KM po kWh + ${(totalDistribution - distributionBaseCost).toFixed(2)} KM po kW`,
        pageW + margin,
        y - 1,
        { align: "right" },
      );
      pdf.setTextColor(0);
      row("Naknada OIE", `${totalOie.toFixed(2)} KM`);
      if (isPartialObračun) {
        y += 1;
        pdf.setFontSize(9);
        pdf.setTextColor(...dangerColor);
        pdf.text(
          "* Mjerno mjesto, Obračunska snaga i PDV nisu uključeni u ukupan iznos (period kraći od 29 dana).",
          margin,
          y,
        );
        y += 6;
        pdf.setTextColor(0);
      } else {
        y += 1;
        row("Osnovica (bez PDV)", `${subtotal.toFixed(2)} KM`);
        row("PDV (17%)", `${vatAmount.toFixed(2)} KM`);
      }

      line();

      // Total
      pdf.setFont("pt-sans", "bold");
      pdf.setFontSize(16);
      pdf.text("UKUPNO SA PDV", margin, y);
      pdf.text(`${total.toFixed(2)} KM`, pageW + margin, y, { align: "right" });
      y += 10;

      // Footer
      pdf.setFont("pt-sans", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(180);
      pdf.text(
        "REERS odluka 17.12.2024 · primjena od 01.06.2026. · informativni obračun",
        margin,
        285,
      );

      pdf.save(`Struja-${periodStart}-${periodEnd}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert(err instanceof Error ? err.message : "Greška pri generisanju PDF-a.");
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="flex-1 text-center py-3 rounded bg-surface-2 hover:bg-border-strong text-fg uppercase tracking-widest text-xs font-bold cursor-pointer border border-border-strong"
    >
      Preuzmi PDF
    </button>
  );
}
