/** Lightweight 3D helpers kept out of the three.js bundle so pages load fast. */

export const LENS_TINTS = [
  { id: "clear", label: "Clear", color: "#d9e8ee", opacity: 0.22 },
  { id: "blue", label: "Blue-light", color: "#9fb6f0", opacity: 0.3 },
  { id: "grey", label: "Grey sun", color: "#2b3036", opacity: 0.82 },
  { id: "brown", label: "Brown sun", color: "#5a3a22", opacity: 0.78 },
] as const;
export type LensTintId = (typeof LENS_TINTS)[number]["id"];

/** Should we start with the static image instead of WebGL? */
export function prefersStatic3D(): { static: boolean; reason: string | null; canLoad: boolean } {
  if (typeof window === "undefined") return { static: true, reason: null, canLoad: false };
  let webgl = false;
  try {
    const c = document.createElement("canvas");
    webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    webgl = false;
  }
  if (!webgl) return { static: true, reason: "Your browser can't show 3D here, so this is a still image.", canLoad: false };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return { static: true, reason: "You've asked for reduced motion, so we're showing a still image first.", canLoad: true };
  }
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2) || (nav.deviceMemory && nav.deviceMemory <= 2)) {
    return { static: true, reason: "To save battery and data on this device, we're showing a still image first.", canLoad: true };
  }
  return { static: false, reason: null, canLoad: true };
}
