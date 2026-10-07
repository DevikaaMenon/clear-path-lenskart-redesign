"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "@/lib/client/api";
import type { NeedId } from "@/lib/taxonomy";

export interface CompareEntry {
  id: string;
  slug: string;
  name: string;
  shape: string;
  rim: string;
  frameType: string;
  lensWidthMm: number;
  price: number;
}

export interface Toast {
  id: number;
  title: string;
  body?: string;
  tone?: "neutral" | "success" | "danger";
  action?: { label: string; onClick: () => void };
  icon?: "check" | "bag" | "heart" | "compare" | "alert" | "trash";
}

interface ShopState {
  need: NeedId | null;
  setNeed: (n: NeedId | null) => void;
  compare: CompareEntry[];
  addCompare: (e: CompareEntry) => "added" | "full" | "exists";
  removeCompare: (id: string) => void;
  clearCompare: () => void;
  wishlist: Set<string>;
  wishlistReady: boolean;
  toggleWishlist: (productId: string, name: string) => Promise<void>;
  cartCount: number;
  refreshCart: () => Promise<void>;
  setCartCount: (n: number) => void;
  largeText: boolean;
  setLargeText: (v: boolean) => void;
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
  announce: (msg: string, assertive?: boolean) => void;
  trayOpen: boolean;
  setTrayOpen: (v: boolean) => void;
}

const Ctx = createContext<ShopState | null>(null);
export const MAX_COMPARE = 3;

const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, v: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage may be unavailable (private mode); state still works in memory */
  }
};

export function ShopProvider({ children, initialNeed }: { children: React.ReactNode; initialNeed: NeedId | null }) {
  const [need, setNeedState] = useState<NeedId | null>(initialNeed);
  const [compare, setCompare] = useState<CompareEntry[]>([]);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [wishlistReady, setWishlistReady] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [largeText, setLargeTextState] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [trayOpen, setTrayOpen] = useState(false);
  const [politeMsg, setPolite] = useState("");
  const [assertiveMsg, setAssertive] = useState("");
  const toastId = useRef(0);

  // Hydrate client-only state
  useEffect(() => {
    setCompare(read<CompareEntry[]>("cp_compare", []));
    setLargeTextState(document.documentElement.dataset.text === "large");
    api<{ productIds: string[] }>("/api/wishlist").then((d) => { setWishlist(new Set(d.productIds)); setWishlistReady(true); }).catch(() => {});
    api<{ count: number }>("/api/cart?summary=1").then((d) => setCartCount(d.count)).catch(() => {});
  }, []);

  const announce = useCallback((msg: string, assertive = false) => {
    // Clear then set so repeated identical messages are still announced.
    const set = assertive ? setAssertive : setPolite;
    set("");
    window.setTimeout(() => set(msg), 60);
  }, []);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = ++toastId.current;
      setToasts((list) => [...list.slice(-2), { ...t, id }]);
      // Toasts with an action (Undo) stay longer so people have time to use them.
      window.setTimeout(() => dismissToast(id), t.action ? 8000 : 4500);
    },
    [dismissToast],
  );

  const setNeed = useCallback((n: NeedId | null) => {
    setNeedState(n);
    document.cookie = n ? `cp_need=${n}; path=/; max-age=${60 * 60 * 24 * 90}; samesite=lax` : "cp_need=; path=/; max-age=0";
  }, []);

  // Mirror of the compare list so add/remove can decide synchronously.
  const compareRef = useRef<CompareEntry[]>([]);
  const commitCompare = useCallback((next: CompareEntry[]) => {
    compareRef.current = next;
    setCompare(next);
    write("cp_compare", next);
  }, []);
  useEffect(() => {
    compareRef.current = compare;
  }, [compare]);

  const addCompare = useCallback((e: CompareEntry) => {
    const list = compareRef.current;
    if (list.some((x) => x.id === e.id)) return "exists" as const;
    if (list.length >= MAX_COMPARE) return "full" as const;
    commitCompare([...list, e]);
    return "added" as const;
  }, [commitCompare]);

  const removeCompare = useCallback((id: string) => {
    commitCompare(compareRef.current.filter((x) => x.id !== id));
  }, [commitCompare]);

  const clearCompare = useCallback(() => commitCompare([]), [commitCompare]);

  const toggleWishlist = useCallback(
    async (productId: string, name: string) => {
      const had = wishlist.has(productId);
      // Optimistic update, rolled back if the server fails.
      setWishlist((s) => {
        const n = new Set(s);
        if (had) n.delete(productId); else n.add(productId);
        return n;
      });
      try {
        await api("/api/wishlist", { method: had ? "DELETE" : "POST", body: { productId } });
        announce(had ? `${name} removed from wishlist` : `${name} saved to wishlist`);
      } catch (err) {
        setWishlist((s) => {
          const n = new Set(s);
          if (had) n.add(productId); else n.delete(productId);
          return n;
        });
        toast({ title: "Wishlist not updated", body: err instanceof ApiError ? err.message : "Please try again.", tone: "danger", icon: "alert" });
      }
    },
    [wishlist, announce, toast],
  );

  const refreshCart = useCallback(async () => {
    try {
      const d = await api<{ count: number }>("/api/cart?summary=1");
      setCartCount(d.count);
    } catch {
      /* count stays as it was */
    }
  }, []);

  const setLargeText = useCallback((v: boolean) => {
    setLargeTextState(v);
    if (v) document.documentElement.dataset.text = "large";
    else delete document.documentElement.dataset.text;
    write("cp_text", v ? "large" : "normal");
  }, []);

  const value = useMemo<ShopState>(
    () => ({
      need, setNeed, compare, addCompare, removeCompare, clearCompare, wishlist, wishlistReady, toggleWishlist,
      cartCount, refreshCart, setCartCount, largeText, setLargeText, toasts, toast, dismissToast, announce,
      trayOpen, setTrayOpen,
    }),
    [need, setNeed, compare, addCompare, removeCompare, clearCompare, wishlist, wishlistReady, toggleWishlist, cartCount, refreshCart, largeText, setLargeText, toasts, toast, dismissToast, announce, trayOpen],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{politeMsg}</div>
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">{assertiveMsg}</div>
    </Ctx.Provider>
  );
}

export function useShop() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useShop must be used inside ShopProvider");
  return c;
}
