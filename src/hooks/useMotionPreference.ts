import { useCallback, useEffect, useState } from "react";
import {
  applyMotionPreference,
  readStoredMotionPreference,
  resolveMotionMode,
  systemPrefersReducedMotion,
  type MotionPreference,
} from "@/lib/motion";

export function useMotionPreference() {
  const [preference, setPreferenceState] = useState<MotionPreference>("system");
  const [mode, setMode] = useState<"reduced" | "full">("full");

  useEffect(() => {
    const p = readStoredMotionPreference();
    setPreferenceState(p);
    setMode(resolveMotionMode(p));

    // Track system preference changes when user is on "system".
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => {
      const current = readStoredMotionPreference();
      if (current === "system") {
        const nextMode = mq.matches ? "reduced" : "full";
        setMode(nextMode);
        document.documentElement.setAttribute("data-motion", nextMode);
      }
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const setPreference = useCallback((p: MotionPreference) => {
    applyMotionPreference(p);
    setPreferenceState(p);
    setMode(resolveMotionMode(p));
  }, []);

  return {
    preference,
    mode,
    reduced: mode === "reduced",
    systemReduced: systemPrefersReducedMotion(),
    setPreference,
  };
}
