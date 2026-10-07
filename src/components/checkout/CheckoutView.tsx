"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ZodError } from "zod";
import { COD_LIMIT, INDIAN_STATES, addressSchema, contactSchema, paymentSchema } from "@/lib/checkout";
import type { CartView as CartData } from "@/lib/server/cart-service";
import { formatINR } from "@/lib/pricing";
import { api, ApiError } from "@/lib/client/api";
import { useShop } from "../providers/ShopProvider";
import { AccordionItem } from "../ui/Accordion";
import { Button, ButtonLink } from "../ui/Button";
import { Input, Select } from "../ui/Field";
import { ErrorSummary } from "../ui/ErrorSummary";
import { UxMarker } from "../ux/UxMarker";
import { Icon, type IconName } from "../ui/Icon";
import { TrustStrip } from "../ui/TrustStrip";
import { OrderSummary } from "../cart/CartView";
import { reportTestError } from "../testmode/TestMode";

type Errors = Record<string, string>;
type Step = "contact" | "address" | "payment";
const STEP_ORDER: Step[] = ["contact", "address", "payment"];

const toErrors = (e: ZodError, prefix: string): Errors => {
  const out: Errors = {};
  for (const i of e.issues) {
    const k = `${prefix}-${i.path.join("-")}`;
    if (!out[k]) out[k] = i.message;
  }
  return out;
};

const METHODS: { id: "upi" | "card" | "netbanking" | "cod"; label: string; icon: IconName; note: string }[] = [
  { id: "upi", label: "UPI", icon: "upi", note: "Pay from any UPI app." },
  { id: "card", label: "Debit or credit card", icon: "card", note: "Visa, Mastercard, RuPay." },
  { id: "netbanking", label: "Net banking", icon: "bank", note: "All major banks." },
  { id: "cod", label: "Cash on delivery", icon: "cash", note: `Pay when it arrives. Up to ${formatINR(COD_LIMIT)}.` },
];

const FIELD_LABEL: Record<string, string> = {
  "contact-email": "Email", "contact-name": "Full name", "contact-phone": "Mobile number",
  "address-line1": "Address line 1", "address-city": "Town or city", "address-state": "State", "address-pincode": "PIN code",
  "payment-upiId": "UPI ID", "payment-cardNumber": "Card number", "payment-expiry": "Expiry", "payment-cvc": "Security code", "payment-bank": "Bank",
};

export function CheckoutView({ initial, user }: { initial: CartData; user: { email: string; name: string } | null }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { setCartCount } = useShop();
  const [open, setOpen] = useState<Step>("contact");
  const [done, setDone] = useState<Set<Step>>(new Set());
  const [contact, setContact] = useState({ email: user?.email ?? "", name: user?.name ?? "", phone: "" });
  const [address, setAddress] = useState({ line1: "", line2: "", city: "", state: "", pincode: "" });
  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>("upi");
  const [pay, setPay] = useState({ upiId: "", cardNumber: "", expiry: "", cvc: "", bank: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [summaryFor, setSummaryFor] = useState<Step | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ title: string; body: string; kind: "payment" | "network" | "price" | "other" } | null>(null);
  const [total, setTotal] = useState(initial.pricing.total);
  const idem = useRef<string>("");
  const summaryRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  // Focus moves to the error summary / banner once it has rendered (a timer could fire too early).
  const [summaryTick, setSummaryTick] = useState(0);
  useEffect(() => {
    if (summaryTick) summaryRef.current?.focus();
  }, [summaryTick]);
  useEffect(() => {
    if (banner) bannerRef.current?.focus();
  }, [banner]);

  // One idempotency key per checkout attempt: retries reuse it, so no duplicate orders.
  useEffect(() => {
    idem.current = crypto.randomUUID();
    try {
      const saved = JSON.parse(sessionStorage.getItem("cp_checkout") ?? "null");
      if (saved) { setContact((c) => ({ ...c, ...saved.contact })); setAddress((a) => ({ ...a, ...saved.address })); }
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem("cp_checkout", JSON.stringify({ contact, address })); } catch { /* ignore */ }
  }, [contact, address]);

  const fail = (step: Step, errs: Errors) => {
    setErrors(errs);
    setSummaryFor(step);
    reportTestError();
    setSummaryTick((t) => t + 1);
  };

  const validate = (step: Step): boolean => {
    const r =
      step === "contact" ? contactSchema.safeParse(contact)
      : step === "address" ? addressSchema.safeParse(address)
      : paymentSchema.safeParse({ method, ...pay });
    if (!r.success) {
      fail(step, toErrors(r.error, step));
      return false;
    }
    setErrors({});
    setSummaryFor(null);
    return true;
  };

  const next = (step: Step) => {
    if (!validate(step)) return;
    setDone((d) => new Set(d).add(step));
    const n = STEP_ORDER[STEP_ORDER.indexOf(step) + 1];
    if (n) setOpen(n);
  };

  const placeOrder = async () => {
    for (const s of STEP_ORDER) {
      if (!validate(s)) { setOpen(s); return; }
    }
    setBusy(true);
    setBanner(null);
    try {
      const res = await api<{ order: { id: string; number: string } }>("/api/orders", {
        method: "POST",
        retry: true, // safe: idempotent
        body: { idempotencyKey: idem.current, contact, address, payment: { method, ...pay }, shownTotal: total },
      });
      setCartCount(0);
      try { sessionStorage.removeItem("cp_checkout"); } catch { /* ignore */ }
      router.push(`/order/${res.order.id}`);
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError(0, "network", "Something went wrong.");
      reportTestError();
      if (err.code === "payment_declined") setBanner({ kind: "payment", title: "Payment didn't go through", body: err.message });
      else if (err.isNetwork) setBanner({ kind: "network", title: "We couldn't reach the server", body: "Your order may not have been placed. Retrying is safe: you won't be charged twice." });
      else if (err.code === "price_changed") {
        setBanner({ kind: "price", title: "Your total has changed", body: err.message });
        if (err.fields?.total) setTotal(+err.fields.total);
      } else if (err.code === "cod_limit") {
        setBanner({ kind: "payment", title: "Cash on delivery isn't available", body: err.message });
      } else if (err.code === "validation_failed" && err.fields) {
        setBanner({ kind: "other", title: "Some details need fixing", body: err.message });
      } else setBanner({ kind: "other", title: "Order not placed", body: err.message });
    } finally {
      setBusy(false);
    }
  };

  const err = (k: string) => errors[k];
  const summaryItems = Object.entries(errors).map(([k, m]) => ({ fieldId: k, message: `${FIELD_LABEL[k] ?? k}: ${m}` }));
  const summaryBlock = (s: Step) => (summaryFor === s && summaryItems.length ? <div className="mb-4"><ErrorSummary ref={summaryRef} items={summaryItems} id={`summary-${s}`} /></div> : null);

  if (!initial.items.length) {
    return (
      <div className="page py-12">
        <h1 className="font-display text-5xl">Checkout</h1>
        <p className="mt-4 text-muted">Your bag is empty.</p>
        <ButtonLink href="/shop" className="mt-6" variant="primary">Browse frames</ButtonLink>
      </div>
    );
  }

  return (
    <div className="page pb-16 pt-10 md:pt-14">
      <p className="eyebrow">Step 4 · Pay</p>
      <h1 className="mt-2 font-display text-5xl">Checkout</h1>
      <p className="relative mt-3 flex w-fit flex-wrap items-center gap-2 pr-6 text-muted">
        <UxMarker id="checkout-guest" />
        {user ? <>Signed in as <strong className="text-ink">{user.email}</strong>.</> : <>Checking out as a guest. <Link href="/account?next=/checkout" className="link">Sign in instead (optional)</Link></>}
      </p>
      <p className="mt-3 inline-flex items-center gap-2 border border-warning bg-warning-soft px-3 py-1.5 text-sm font-semibold">
        <Icon name="info" size={18} className="text-warning" /> Demo checkout, no real payment. Don&apos;t enter real card details.
      </p>

      <div className="grid-page mt-8 gap-y-8">
        <div className="col-span-4 md:col-span-8 xl:col-span-7">
          <AnimatePresence>
            {banner ? (
              <motion.div
                ref={bannerRef}
                tabIndex={-1}
                role="alert"
                initial={reduce ? false : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="relative mb-6 border-2 border-danger bg-danger-soft p-4"
                data-testid="checkout-error"
              >
                <UxMarker id="checkout-recovery" />
                <p className="flex items-center gap-2 text-lg font-bold text-danger"><Icon name="alert" /> {banner.title}</p>
                <p className="mt-1">{banner.body}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {banner.kind === "price" ? (
                    <Button variant="primary" size="sm" onClick={placeOrder} loading={busy}>Pay the new total · {formatINR(total)}</Button>
                  ) : (
                    <Button variant="primary" size="sm" icon="rotate" onClick={placeOrder} loading={busy}>Retry</Button>
                  )}
                  <Button variant="secondary" size="sm" icon="card" onClick={() => { setBanner(null); setOpen("payment"); }}>Change method</Button>
                  <ButtonLink href="/cart" variant="ghost" size="sm">Back to bag</ButtonLink>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="relative border-t border-ink">
            <UxMarker id="checkout-steps" />
            <AccordionItem
              title="1. Contact"
              summary={done.has("contact") ? `${contact.name} · ${contact.email} · ${contact.phone}` : "Email and mobile number"}
              open={open === "contact"}
              onToggle={() => setOpen("contact")}
              status={summaryFor === "contact" ? "error" : done.has("contact") ? "done" : null}
              headingLevel={2}
            >
              {summaryBlock("contact")}
              <form noValidate className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); next("contact"); }}>
                <Input id="contact-email" label="Email" type="email" autoComplete="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} error={err("contact-email")} hint="For your receipt and tracking link." shellClassName="md:col-span-2" />
                <Input id="contact-name" label="Full name" autoComplete="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} error={err("contact-name")} />
                <Input id="contact-phone" label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} error={err("contact-phone")} hint="For delivery updates only." />
                <div className="md:col-span-2"><Button type="submit" variant="primary" iconRight="arrow-right">Continue to delivery</Button></div>
              </form>
            </AccordionItem>

            <AccordionItem
              title="2. Delivery address"
              summary={done.has("address") ? `${address.line1}, ${address.city} ${address.pincode}` : "Where should we deliver?"}
              open={open === "address"}
              onToggle={() => setOpen("address")}
              status={summaryFor === "address" ? "error" : done.has("address") ? "done" : null}
              headingLevel={2}
            >
              {summaryBlock("address")}
              <form noValidate className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); next("address"); }}>
                <Input id="address-line1" label="House or flat number and street" autoComplete="address-line1" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} error={err("address-line1")} shellClassName="md:col-span-2" />
                <Input id="address-line2" label="Area or landmark" optional autoComplete="address-line2" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} shellClassName="md:col-span-2" />
                <Input id="address-city" label="Town or city" autoComplete="address-level2" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} error={err("address-city")} />
                <Select id="address-state" label="State" autoComplete="address-level1" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} error={err("address-state")}>
                  <option value="">Choose a state</option>
                  {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                </Select>
                <Input id="address-pincode" label="PIN code" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, "") })} error={err("address-pincode")} />
                <div className="md:col-span-2"><Button type="submit" variant="primary" iconRight="arrow-right">Continue to payment</Button></div>
              </form>
            </AccordionItem>

            <AccordionItem
              title="3. Payment"
              summary={METHODS.find((m) => m.id === method)?.label}
              open={open === "payment"}
              onToggle={() => setOpen("payment")}
              status={summaryFor === "payment" ? "error" : null}
              headingLevel={2}
            >
              {summaryBlock("payment")}
              <fieldset>
                <legend className="mb-3 font-semibold">How would you like to pay?</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {METHODS.map((m) => {
                    const codOff = m.id === "cod" && total > COD_LIMIT;
                    return (
                      <label key={m.id} className={`flex min-h-[64px] items-start gap-3 border p-3 transition-colors has-[:checked]:border-ink has-[:checked]:bg-accent-soft has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus ${codOff ? "cursor-not-allowed border-dashed border-line-strong opacity-70" : "cursor-pointer border-line-strong bg-surface hover:border-ink"}`}>
                        <input type="radio" name="method" className="mt-1 h-5 w-5 accent-[var(--c-ink)]" checked={method === m.id} disabled={codOff} onChange={() => { setMethod(m.id); setErrors({}); setSummaryFor(null); }} />
                        <Icon name={m.icon} className="mt-0.5 shrink-0 text-accent" />
                        <span>
                          <span className="block font-semibold">{m.label}</span>
                          <span className="block text-sm text-muted">{codOff ? `Not available above ${formatINR(COD_LIMIT)}.` : m.note}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {method === "upi" ? (
                  <Input id="payment-upiId" label="UPI ID" autoComplete="off" value={pay.upiId} onChange={(e) => setPay({ ...pay, upiId: e.target.value })} error={err("payment-upiId")} hint="Demo: any ID like name@okbank works. fail@demo simulates a decline." shellClassName="md:col-span-2" />
                ) : method === "card" ? (
                  <>
                    <Input id="payment-cardNumber" label="Card number" inputMode="numeric" autoComplete="off" value={pay.cardNumber} onChange={(e) => setPay({ ...pay, cardNumber: e.target.value })} error={err("payment-cardNumber")} hint="Demo: use 4242 4242 4242 4242. 4000 0000 0000 0002 simulates a decline." shellClassName="md:col-span-2" />
                    <Input id="payment-expiry" label="Expiry (MM/YY)" inputMode="numeric" autoComplete="off" placeholder="08/29" value={pay.expiry} onChange={(e) => setPay({ ...pay, expiry: e.target.value })} error={err("payment-expiry")} />
                    <Input id="payment-cvc" label="Security code" inputMode="numeric" autoComplete="off" maxLength={4} value={pay.cvc} onChange={(e) => setPay({ ...pay, cvc: e.target.value })} error={err("payment-cvc")} />
                  </>
                ) : method === "netbanking" ? (
                  <Select id="payment-bank" label="Bank" value={pay.bank} onChange={(e) => setPay({ ...pay, bank: e.target.value })} error={err("payment-bank")}>
                    <option value="">Choose your bank</option>
                    {["Demo Bank of India", "Example National Bank", "Sample Co-operative Bank"].map((b) => <option key={b}>{b}</option>)}
                  </Select>
                ) : (
                  <p className="text-muted md:col-span-2">Pay {formatINR(total)} in cash or by UPI to the delivery partner. Please keep the exact amount ready if paying cash.</p>
                )}
              </div>
            </AccordionItem>
          </div>

          <div className="relative mt-6 flex flex-col gap-3">
            <UxMarker id="checkout-pay" />
            <Button variant="primary" size="lg" full icon="lock" onClick={placeOrder} loading={busy} loadingText="Placing your order" data-testid="place-order">
              {method === "cod" ? "Place order" : "Pay"} · {formatINR(total)}
            </Button>
            <p className="text-center text-sm text-muted">By placing the order you agree to the demo terms. You can cancel free of charge until it ships.</p>
          </div>
        </div>
        <aside className="col-span-4 md:col-span-8 xl:col-span-5" aria-label="Order summary">
          <div className="flex flex-col gap-4 xl:sticky xl:top-[calc(var(--header-h)+24px)]">
            <OrderSummary data={initial} />
            <TrustStrip compact />
          </div>
        </aside>
      </div>
    </div>
  );
}
