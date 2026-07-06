"use client";

import { useState } from "react";
import { ApiKeyModal } from "./ApiKeyModal";

export function HeaderSettings() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs uppercase tracking-widest text-[var(--fg-dim)] hover:text-[var(--fg-strong)] cursor-pointer"
        title="Postavke AI ključa"
      >
        ⚙
      </button>
      {open && (
        <ApiKeyModal
          onClose={() => setOpen(false)}
          onSaved={() => setOpen(false)}
        />
      )}
    </>
  );
}
