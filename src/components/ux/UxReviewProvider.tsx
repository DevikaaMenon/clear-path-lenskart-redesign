"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

/**
 * State for the "What changed" review layer: whether markers are shown,
 * which card is open (and whether it is pinned), and a registry of mounted
 * marker buttons so the panel can scroll to them.
 */
interface UxReviewState {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  openId: string | null;
  pinned: boolean;
  open: (id: string, pin?: boolean) => void;
  close: (id?: string) => void;
  register: (id: string, el: HTMLButtonElement | null) => void;
  elementFor: (id: string) => HTMLButtonElement | null;
}

const Ctx = createContext<UxReviewState | null>(null);
const KEY = "cp_ux_markers";

export function UxReviewProvider({ children }: { children: React.ReactNode }) {
  // Default On (as requested). Saved choice is applied after mount.
  const [enabled, setEnabledState] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);
  const els = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v === "off") setEnabledState(false);
    } catch {
      /* storage unavailable: keep default */
    }
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    // Keep the pre-paint attribute in sync (it hides markers before hydration; see layout.tsx).
    if (v) delete document.documentElement.dataset.ux;
    else document.documentElement.dataset.ux = "off";
    if (!v) {
      state.current = { openId: null, pinned: false };
      setOpenId(null);
      setPinned(false);
    }
    try {
      localStorage.setItem(KEY, v ? "on" : "off");
    } catch {
      /* ignore */
    }
  }, []);

  // A hover or focus never downgrades a card that was pinned by a click.
  const state = useRef({ openId: null as string | null, pinned: false });
  const open = useCallback((id: string, pin = false) => {
    const keepPinned = state.current.openId === id && state.current.pinned;
    const nextPinned = pin || keepPinned;
    state.current = { openId: id, pinned: nextPinned };
    setOpenId(id);
    setPinned(nextPinned);
  }, []);
  const close = useCallback((id?: string) => {
    if (id && state.current.openId !== id) return;
    state.current = { openId: null, pinned: false };
    setOpenId(null);
    setPinned(false);
  }, []);
  const register = useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) els.current.set(id, el);
    else els.current.delete(id);
  }, []);
  const elementFor = useCallback((id: string) => els.current.get(id) ?? null, []);

  const value = useMemo(
    () => ({ enabled, setEnabled, openId, pinned, open, close, register, elementFor }),
    [enabled, setEnabled, openId, pinned, open, close, register, elementFor],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUxReview() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useUxReview must be used inside UxReviewProvider");
  return c;
}
