"use client";

import { useState } from "react";
import { saveAiApiKeyAction } from "@/app/actions/settings";

export function ApiKeyModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const res = await saveAiApiKeyAction(key);
    if (res.error) {
      setError(res.error);
      setSaving(false);
    } else {
      onSaved();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#111",
          border: "1px solid #333",
          borderRadius: 12,
          padding: 28,
          maxWidth: 440,
          width: "100%",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#eee",
            marginBottom: 4,
          }}
        >
          🤖 Potreban API ključ
        </div>
        <p
          style={{
            fontSize: 12,
            color: "#999",
            lineHeight: 1.5,
            marginBottom: 16,
          }}
        >
          Za AI prepoznavanje brojila potreban je besplatni Google Gemini API
          ključ. Unesite ga jednom i ostat će sačuvan na vašem nalogu.
        </p>

        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            fontSize: 12,
            color: "#7bb7ff",
            marginBottom: 16,
            textDecoration: "underline",
          }}
        >
          Nabavite besplatni ključ ↗
        </a>

        {error && (
          <div
            style={{
              background: "#1c0a0a",
              border: "1px solid #7f1d1d",
              borderRadius: 6,
              padding: "10px 12px",
              color: "#fca5a5",
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="AIzaSy..."
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "#000",
            border: "1px solid #333",
            borderRadius: 6,
            color: "#eee",
            fontSize: 13,
            fontFamily: "monospace",
            outline: "none",
            marginBottom: 14,
            boxSizing: "border-box",
          }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 6,
              border: "1px solid #333",
              background: "transparent",
              color: "#999",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Odustani
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !key.trim()}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 6,
              border: "none",
              background: saving ? "#555" : "#2a7a4a",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: !key.trim() ? 0.5 : 1,
              fontFamily: "inherit",
            }}
          >
            {saving ? "Provjeravam…" : "Sačuvaj"}
          </button>
        </div>
      </div>
    </div>
  );
}
