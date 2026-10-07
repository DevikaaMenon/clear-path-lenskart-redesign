"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/client/api";
import { formatINR } from "@/lib/pricing";
import { useShop } from "../providers/ShopProvider";
import { Button } from "../ui/Button";
import { Input } from "../ui/Field";
import { ErrorSummary } from "../ui/ErrorSummary";

interface OrderRow { id: string; number: string; total: number; createdAt: string; items: number }

export function AccountView({ user, orders }: { user: { name: string; email: string } | null; orders: OrderRow[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const { refreshCart, toast } = useShop();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage(null);
    try {
      await api(`/api/auth/${mode}`, { method: "POST", body: mode === "login" ? { email: form.email, password: form.password } : form });
      await refreshCart();
      toast({ title: mode === "login" ? "Signed in" : "Account created", body: "Your bag and wishlist are saved to your account.", tone: "success", icon: "check" });
      router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/account");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setMessage(err.message);
        if (err.fields) setErrors(Object.fromEntries(Object.entries(err.fields).map(([k, v]) => [`acc-${k}`, v])));
      } else setMessage("Something went wrong. Please try again.");
      window.setTimeout(() => summaryRef.current?.focus(), 30);
    } finally {
      setBusy(false);
    }
  };

  if (user) {
    return (
      <div className="page pb-16 pt-10 md:pt-14">
        <h1 className="font-display text-5xl">Hello, {user.name.split(" ")[0]}</h1>
        <p className="mt-2 text-muted">{user.email}</p>
        <section className="mt-10" aria-labelledby="orders-t">
          <h2 id="orders-t" className="font-display text-3xl">Your orders</h2>
          {orders.length ? (
            <ul className="mt-4 border-t border-ink">
              {orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4">
                  <span><span className="num font-bold">{o.number}</span> · {o.items} {o.items === 1 ? "item" : "items"}</span>
                  <span className="num">{formatINR(o.total)}</span>
                  <Link href={`/order/${o.id}`} className="link">View order {o.number}</Link>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-muted">No orders yet.</p>}
        </section>
        <Button variant="secondary" className="mt-10" onClick={async () => { await api("/api/auth/logout", { method: "POST" }); await refreshCart(); router.refresh(); }}>Sign out</Button>
      </div>
    );
  }

  const summary = message ? (Object.keys(errors).length ? Object.entries(errors).map(([fieldId, m]) => ({ fieldId, message: m })) : [{ fieldId: "acc-email", message }]) : [];

  return (
    <div className="page grid-page gap-y-8 pb-16 pt-10 md:pt-14">
      <div className="col-span-4 md:col-span-8 xl:col-span-5">
        <h1 className="font-display text-5xl">Account</h1>
        <p className="mt-3 text-lg text-muted">An account is optional. You can always check out as a guest. Signing in keeps your bag, wishlist and orders across devices.</p>
        <div role="tablist" aria-label="Sign in or create an account" className="mt-8 flex gap-1 border-b border-ink">
          {(["login", "register"] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setMessage(null); setErrors({}); }} className={`min-h-[48px] px-4 font-semibold ${mode === m ? "bg-ink text-paper" : "hover:bg-sunk"}`}>
              {m === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
        <form noValidate onSubmit={submit} className="mt-6 flex flex-col gap-4" role="tabpanel">
          <ErrorSummary ref={summaryRef} id="acc-summary" items={summary} title="We couldn't sign you in" />
          {mode === "register" ? <Input id="acc-name" label="Name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors["acc-name"]} /> : null}
          <Input id="acc-email" label="Email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors["acc-email"]} />
          <Input id="acc-password" label="Password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors["acc-password"]} hint={mode === "register" ? "At least 10 characters." : undefined} />
          <Button type="submit" variant="primary" loading={busy}>{mode === "login" ? "Sign in" : "Create account"}</Button>
          <Link href={next ?? "/cart"} className="link self-start">Continue as a guest instead</Link>
        </form>
      </div>
    </div>
  );
}
