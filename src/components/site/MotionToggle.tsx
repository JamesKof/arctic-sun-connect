import { useEffect, useRef, useState } from "react";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import type { MotionPreference } from "@/lib/motion";

const OPTIONS: { value: MotionPreference; label: string; hint: string }[] = [
  { value: "system", label: "System", hint: "Follow OS preference" },
  { value: "full", label: "On", hint: "Full animations" },
  { value: "reduced", label: "Off", hint: "Reduce motion" },
];

export function MotionToggle() {
  const { preference, mode, setPreference } = useMotionPreference();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = mode === "reduced" ? "Motion off" : "Motion on";

  return (
    <div ref={ref} className="fixed bottom-4 right-4 z-[60]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Animation preferences — currently ${label}`}
        title={`Animations: ${label}`}
        className="glass flex h-11 w-11 items-center justify-center rounded-full border border-arctic-deep/10 text-arctic-deep shadow-lg ring-1 ring-arctic-deep/5 transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora"
      >
        <MotionIcon reduced={mode === "reduced"} />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Animation preferences"
          className="glass absolute bottom-14 right-0 w-56 rounded-2xl border border-arctic-deep/10 p-2 shadow-2xl"
        >
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-arctic-deep/60">
            Animations
          </p>
          {OPTIONS.map((opt) => {
            const active = preference === opt.value;
            return (
              <button
                key={opt.value}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setPreference(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                  active
                    ? "bg-arctic-deep text-white"
                    : "text-arctic-deep hover:bg-arctic-deep/5"
                }`}
              >
                <span className="font-medium">{opt.label}</span>
                <span className={`text-[11px] ${active ? "text-white/70" : "text-arctic-deep/50"}`}>
                  {opt.hint}
                </span>
              </button>
            );
          })}
          <p className="px-3 pb-2 pt-2 text-[11px] leading-relaxed text-arctic-deep/60">
            Preference saved on this device.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function MotionIcon({ reduced }: { reduced: boolean }) {
  if (reduced) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M5 5l14 14" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 12c3-6 13-6 16 0" />
      <path d="M4 17c3-4 13-4 16 0" />
      <path d="M4 7c3-3 13-3 16 0" />
    </svg>
  );
}
