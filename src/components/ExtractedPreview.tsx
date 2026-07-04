"use client";

import type { ExtractResult } from "@/lib/vision/types";

export function ExtractedPreview({
  result,
  onEdit,
}: {
  result: ExtractResult;
  onEdit: (updated: { vt?: number; mt?: number }) => void;
}) {
  const isLow = result.confidence === "low";
  const bg = isLow ? "#2d1515" : "#0f2d1a";
  const border = isLow ? "var(--danger)" : "var(--success)";
  const textColor = isLow ? "var(--danger)" : "var(--success)";

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 6,
        padding: 14,
        marginBottom: 14,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: textColor,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {isLow
          ? "⚠ Nisko povjerenje – provjerite vrijednosti prije spremanja"
          : "✓ Očitano sa fotografije"}
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "var(--warn)", marginBottom: 4 }}>VT</div>
          <input
            type="number"
            step="1"
            defaultValue={result.vt}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (Number.isFinite(v)) onEdit({ vt: v, mt: result.mt });
            }}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 4,
              color: "var(--fg-strong)",
              fontSize: 20,
              fontWeight: 700,
              fontFamily: "inherit",
              padding: "6px 10px",
              width: "100%",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "var(--info)", marginBottom: 4 }}>MT</div>
          <input
            type="number"
            step="1"
            defaultValue={result.mt}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (Number.isFinite(v)) onEdit({ vt: result.vt, mt: v });
            }}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 4,
              color: "var(--fg-strong)",
              fontSize: 20,
              fontWeight: 700,
              fontFamily: "inherit",
              padding: "6px 10px",
              width: "100%",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {result.note && (
        <div style={{ fontSize: 12, color: "var(--fg-dim)", marginTop: 8 }}>
          {result.note}
        </div>
      )}
    </div>
  );
}
