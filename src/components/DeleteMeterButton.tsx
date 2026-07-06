"use client";

import { deleteMeterAction } from "@/app/actions/meters";

export function DeleteMeterButton({ meterId }: { meterId: string }) {
  return (
    <form
      action={deleteMeterAction}
      onSubmit={(e) => {
        if (!window.confirm("Obrisati brojilo i sve račune? Ova radnja je nepovratna.")) {
          e.preventDefault();
        }
      }}
      className="mt-10 pt-6 border-t border-[var(--border)]"
    >
      <input type="hidden" name="id" value={meterId} />
      <button
        type="submit"
        className="text-xs uppercase tracking-widest text-[var(--fg-faint)] hover:text-[var(--danger)] cursor-pointer"
      >
        Obriši brojilo (i sve račune)
      </button>
    </form>
  );
}
