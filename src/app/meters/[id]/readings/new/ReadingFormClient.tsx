"use client";

import { useMemo, useState, useCallback } from "react";
import { createReadingAction } from "@/app/actions/readings";
import { calculateBill, type BillResult, type TariffGroup, type TariffRates } from "@/lib/tariff";
import { BillBreakdown } from "@/components/BillBreakdown";
import { CameraCapture, type PhotoData } from "@/components/CameraCapture";
import { ExtractedPreview } from "@/components/ExtractedPreview";
import { useSearchParams } from "next/navigation";
import type { ExtractResult } from "@/lib/vision/types";

export function ReadingFormClient({
  meterId,
  tariffGroup,
  prev,
  approvedKw,
  rates,
}: {
  meterId: string;
  tariffGroup: TariffGroup;
  prev: { reading?: number; vt?: number; mt?: number };
  approvedKw: number;
  rates: TariffRates;
}) {
  const today = new Date().toISOString().slice(0, 10);

  // Input mode
  const [inputMode, setInputMode] = useState<"manual" | "photo">("manual");

  // Manual / fallback values
  const [reading, setReading] = useState("");
  const [vt, setVt] = useState("");
  const [mt, setMt] = useState("");
  const [recordedAt, setRecordedAt] = useState(today);
  const [pending, setPending] = useState(false);

  // Photo state
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState<ExtractResult | null>(null);
  const [extractError, setExtractError] = useState("");

  // After extraction, the corrected values user wants to submit
  const [submitValues, setSubmitValues] = useState<{
    reading?: number;
    vt?: number;
    mt?: number;
  }>({});

  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const handlePhotosChange = useCallback((newPhotos: PhotoData[]) => {
    setPhotos(newPhotos);
    setExtractResult(null);
    setExtractError("");
    setSubmitValues({});
  }, []);

  const handleExtract = async () => {
    if (!photos.length) return;
    setExtracting(true);
    setExtractError("");
    try {
      const res = await fetch("/api/vision/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: photos[0].base64,
          mediaType: photos[0].mediaType,
          tariffGroup,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Extraction failed");
      }
      const result: ExtractResult = await res.json();
      setExtractResult(result);
      setSubmitValues({
        reading: result.reading,
        vt: result.vt,
        mt: result.mt,
      });
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setExtracting(false);
    }
  };

  const handleEditResult = useCallback(
    (updated: { reading?: number; vt?: number; mt?: number }) => {
      setSubmitValues(updated);
    },
    []
  );

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await createReadingAction({
        meter_id: meterId,
        recorded_at: String(formData.get("recorded_at") ?? ""),
        reading: submitValues.reading ?? parseOptional(formData.get("reading")),
        vt: submitValues.vt ?? parseOptional(formData.get("vt")),
        mt: submitValues.mt ?? parseOptional(formData.get("mt")),
        source: inputMode === "photo" ? "ai" : "manual",
      });
    } finally {
      setPending(false);
    }
  }

  const preview = useMemo<BillResult | null>(() => {
    const currReading = inputMode === "photo"
      ? submitValues.reading
      : parseFloat(reading);
    const currVt = inputMode === "photo"
      ? submitValues.vt
      : parseFloat(vt);
    const currMt = inputMode === "photo"
      ? submitValues.mt
      : parseFloat(mt);
    if (tariffGroup === "TG1") {
      if (currReading == null || Number.isNaN(currReading)) return null;
      return calculateBill("TG1", approvedKw, prev, { reading: currReading }, rates);
    }
    if (currVt == null || currMt == null || Number.isNaN(currVt) || Number.isNaN(currMt)) return null;
    return calculateBill("TG2", approvedKw, prev, { vt: currVt, mt: currMt }, rates);
  }, [reading, vt, mt, inputMode, submitValues, prev, tariffGroup, approvedKw, rates]);

  const style = {
    segmented: {
      display: "flex",
      gap: 0,
      marginBottom: 14,
      border: "1px solid var(--border-strong)",
      borderRadius: 6,
      overflow: "hidden",
    },
    seg: (active: boolean) => ({
      flex: 1,
      padding: "9px 0",
      fontSize: 12,
      letterSpacing: "0.08em",
      textTransform: "uppercase" as const,
      background: active ? "var(--accent)" : "transparent",
      color: active ? "#fff" : "var(--fg-dim)",
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 600,
      transition: "all 0.15s",
    }),
    btnSecondary: {
      width: "100%",
      padding: "11px",
      fontSize: 12,
      letterSpacing: "0.1em",
      textTransform: "uppercase" as const,
      fontWeight: 700,
      fontFamily: "inherit",
      borderRadius: 6,
      cursor: "pointer",
      border: "1px solid var(--border-strong)",
      background: "var(--surface-2)",
      color: "var(--fg-dim)",
      marginBottom: 14,
    },
  };

  return (
    <div>
      {/* Input mode toggle */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, color: "var(--fg-mute)", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
          Način unosa
        </label>
        <div style={style.segmented}>
          <button
            style={style.seg(inputMode === "manual")}
            onClick={() => { setInputMode("manual"); setExtractResult(null); }}
          >
            ✏ Ručni unos
          </button>
          <button
            style={style.seg(inputMode === "photo")}
            onClick={() => { setInputMode("photo"); }}
          >
            📷 Fotografija
          </button>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-5">
        {urlError && (
          <div className="border border-[var(--border)] rounded p-3 bg-[color:color-mix(in_srgb,var(--danger)_15%,transparent)] text-[var(--danger)] text-xs">
            ⚠ {urlError}
          </div>
        )}

        {/* ── PHOTO MODE ── */}
        {inputMode === "photo" && (
          <div>
            <CameraCapture onPhotosChange={handlePhotosChange} />

            {photos.length > 0 && !extractResult && extractError && (
              <div style={{ background: "#1c0a0a", border: "1px solid #7f1d1d", borderRadius: 6, padding: "12px 14px", color: "#fca5a5", fontSize: 13, marginBottom: 14 }}>
                {extractError}
              </div>
            )}

            {photos.length > 0 && !extracting && !extractResult && (
              <button type="button" style={style.btnSecondary} onClick={handleExtract}>
                🔍 Ekstraktuj očitavanje (AI)
              </button>
            )}

            {extracting && (
              <div style={{ textAlign: "center", color: "var(--fg-dim)", fontSize: 13, padding: "10px 0", marginBottom: 14 }}>
                ⏳ Analiziram fotografiju...
              </div>
            )}

            {extractResult && (
              <ExtractedPreview
                result={extractResult}
                tariffGroup={tariffGroup}
                onEdit={handleEditResult}
              />
            )}
          </div>
        )}

        {/* ── MANUAL INPUT (visible in both modes as fallback if no photo) ── */}
        {(inputMode === "manual" || (inputMode === "photo" && !extractResult)) &&
          (tariffGroup === "TG1" ? (
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[var(--fg-mute)] mb-1.5">
                Trenutno stanje (kWh)
              </label>
              <input
                name="reading"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={reading}
                onChange={e => setReading(e.target.value)}
                placeholder={prev.reading !== undefined ? `npr. ${(prev.reading + 200).toFixed(0)}` : "npr. 12500"}
                required
                className="w-full px-3 py-3 bg-[var(--bg)] border border-[var(--border-strong)] rounded text-[var(--fg-strong)] text-base outline-none focus:border-[var(--accent-strong)]"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--warn)] mb-1.5">
                  VT – trenutno
                </label>
                <input
                  name="vt"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={vt}
                  onChange={e => setVt(e.target.value)}
                  placeholder="VT"
                  required
                  className="w-full px-3 py-3 bg-[var(--bg)] border border-[var(--border-strong)] rounded text-[var(--fg-strong)] text-base outline-none focus:border-[var(--accent-strong)]"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-[var(--info)] mb-1.5">
                  MT – trenutno
                </label>
                <input
                  name="mt"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={mt}
                  onChange={e => setMt(e.target.value)}
                  placeholder="MT"
                  required
                  className="w-full px-3 py-3 bg-[var(--bg)] border border-[var(--border-strong)] rounded text-[var(--fg-strong)] text-base outline-none focus:border-[var(--accent-strong)]"
                />
              </div>
            </div>
          ))
        }

        <div>
          <label className="block text-[11px] uppercase tracking-widest text-[var(--fg-mute)] mb-1.5">
            Datum očitanja
          </label>
          <input
            name="recorded_at"
            type="date"
            value={recordedAt}
            onChange={e => setRecordedAt(e.target.value)}
            required
            className="w-full px-3 py-2.5 bg-[var(--bg)] border border-[var(--border-strong)] rounded text-[var(--fg-strong)] outline-none focus:border-[var(--accent-strong)]"
          />
        </div>

        {preview && (
          <BillBreakdown
            blocks={preview.blocks}
            approved_kw={approvedKw}
            mjernoMjesto={preview.mjernoMjesto}
            obracunskaSnaga={preview.obracunskaSnaga}
            totalEnergy={preview.totalEnergy}
            totalOie={preview.totalOie}
            subtotal={preview.subtotal}
            vatAmount={preview.vatAmount}
            total={preview.total}
            consumptionKwh={preview.consumptionKwh}
          />
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 rounded bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-white uppercase tracking-widest text-xs font-bold cursor-pointer"
        >
          {pending ? "Spremam…" : "Spremi očitanje (i račun)"}
        </button>
      </form>
    </div>
  );
}

function parseOptional(v: FormDataEntryValue | null): number | undefined {
  if (v == null || v === "") return undefined;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : undefined;
}
