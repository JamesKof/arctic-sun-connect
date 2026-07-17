// Shared motion system — timing, easing, and user preference.
// All animations across the site should reference these tokens to stay consistent.

export const easing = {
  // Signature "expo-out" — used for reveals, cards, hover lifts.
  expoOut: "cubic-bezier(0.16, 1, 0.3, 1)",
  // Smooth in/out — used for loops (aurora, gradient pans).
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
  // Snappy — used for micro-interactions (buttons, taps).
  snappy: "cubic-bezier(0.2, 0.8, 0.2, 1)",
} as const;

export const duration = {
  instant: 120,
  fast: 220,
  base: 360,
  slow: 720,
  cinematic: 1200,
} as const;

export const stagger = {
  tight: 60,
  base: 90,
  loose: 140,
} as const;

// Persisted user preference key.
export const MOTION_STORAGE_KEY = "api:motion-preference";
export type MotionPreference = "system" | "reduced" | "full";

// Read once (SSR-safe). Value is applied by an inline script in <head>
// so that it never flashes; this reader is for React state hydration only.
export function readStoredMotionPreference(): MotionPreference {
  if (typeof window === "undefined") return "system";
  try {
    const v = window.localStorage.getItem(MOTION_STORAGE_KEY);
    if (v === "reduced" || v === "full" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "system";
}

export function systemPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Resolve the effective mode ("reduced" or "full") from the stored preference.
export function resolveMotionMode(pref: MotionPreference): "reduced" | "full" {
  if (pref === "reduced") return "reduced";
  if (pref === "full") return "full";
  return systemPrefersReducedMotion() ? "reduced" : "full";
}

export function applyMotionPreference(pref: MotionPreference) {
  if (typeof document === "undefined") return;
  const mode = resolveMotionMode(pref);
  document.documentElement.setAttribute("data-motion", mode);
  try {
    window.localStorage.setItem(MOTION_STORAGE_KEY, pref);
  } catch {
    /* ignore */
  }
}

// Inline snippet injected into <head> to set data-motion before first paint,
// preventing any animation flash-of-full-motion for users who chose "reduced".
export const MOTION_BOOT_SCRIPT = `
(function(){try{
  var k='${MOTION_STORAGE_KEY}';
  var p=localStorage.getItem(k)||'system';
  var m=(p==='reduced'||p==='full')?p:(matchMedia('(prefers-reduced-motion: reduce)').matches?'reduced':'full');
  document.documentElement.setAttribute('data-motion',m);
}catch(e){document.documentElement.setAttribute('data-motion','full');}})();
`.trim();
