"use client";

import { useEffect, useRef, useState } from "react";
import { SLOTS } from "@/lib/stores";
import { api, ApiError } from "@/lib/client/api";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Field";
import { ErrorSummary } from "../ui/ErrorSummary";
import { Icon } from "../ui/Icon";
import { CheckedMark } from "../prescription/PrescriptionFlow";

interface Store { id: string; name: string; city: string; area: string; address: string; hours: string; eyeTest: boolean }

const LABEL: Record<string, string> = { storeId: "Store", name: "Name", phone: "Mobile number", date: "Date", slot: "Time" };

export function EyeTestBooking({ stores }: { stores: Store[] }) {
  const testStores = stores.filter((s) => s.eyeTest);
  // Built after mount so server and browser never disagree about "today" or date formatting.
  const [days, setDays] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    const out: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      out.push({ value, label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) });
    }
    setDays(out);
  }, []);
  const [form, setForm] = useState({ storeId: "", name: "", phone: "", date: "", slot: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ store: string; address: string; date: string; slot: string } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.storeId) errs.storeId = "Choose a store.";
    if (form.name.trim().length < 2) errs.name = "Enter your name.";
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, ""))) errs.phone = "Enter a 10-digit Indian mobile number.";
    if (!form.date) errs.date = "Choose a date.";
    if (!form.slot) errs.slot = "Choose a time.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      window.setTimeout(() => summaryRef.current?.focus(), 30);
      return;
    }
    setBusy(true);
    setFailure(null);
    try {
      const r = await api<{ booking: { store: string; address: string; date: string; slot: string } }>("/api/eye-test", { method: "POST", body: form });
      setDone(r.booking);
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      setFailure(err instanceof ApiError ? err.message : "Couldn't book. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-start gap-3 border border-ink bg-surface p-6" role="status">
        <CheckedMark />
        <h3 className="font-display text-3xl">Eye test booked</h3>
        <p>{done.store}, {days.find((d) => d.value === done.date)?.label ?? done.date} at <span className="num">{done.slot}</span>.</p>
        <p className="text-sm text-muted">{done.address}. It takes about 20 minutes and is free. (Demo: no SMS is sent.)</p>
        <Button variant="secondary" onClick={() => { setDone(null); setForm({ storeId: "", name: "", phone: "", date: "", slot: "" }); }}>Book another</Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4 border border-ink bg-surface p-5 md:p-6" aria-labelledby="book-title">
      <h3 id="book-title" className="font-display text-3xl">Book a free eye test</h3>
      <ErrorSummary ref={summaryRef} id="book-summary" items={Object.entries(errors).map(([k, m]) => ({ fieldId: `book-${k}`, message: `${LABEL[k] ?? k}: ${m}` }))} />
      {failure && !Object.keys(errors).length ? <p role="alert" className="flex gap-2 font-semibold text-danger"><Icon name="alert" size={20} />{failure}</p> : null}
      <Select id="book-storeId" label="Store" value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })} error={errors.storeId} hint="Only stores with an optometrist are listed.">
        <option value="">Choose a store</option>
        {testStores.map((s) => <option key={s.id} value={s.id}>{s.city}: {s.area}</option>)}
      </Select>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select id="book-date" label="Date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} error={errors.date}>
          <option value="">Choose a date</option>
          {days.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </Select>
        <fieldset>
          <legend className="text-sm font-semibold">Time</legend>
          <div id="book-slot" tabIndex={-1} className="mt-1.5 grid grid-cols-4 gap-1.5">
            {SLOTS.map((s) => (
              <label key={s} className="num grid min-h-[44px] cursor-pointer place-items-center border border-line-strong text-sm hover:border-ink has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus">
                <input type="radio" name="slot" value={s} className="sr-only" checked={form.slot === s} onChange={() => setForm({ ...form, slot: s })} />
                {s}
              </label>
            ))}
          </div>
          {errors.slot ? <p className="mt-1 text-sm font-semibold text-danger">{errors.slot}</p> : null}
        </fieldset>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input id="book-name" label="Your name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
        <Input id="book-phone" label="Mobile number" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} hint="For a reminder only." />
      </div>
      <Button type="submit" variant="primary" loading={busy} loadingText="Booking" iconRight="arrow-right">Book my free eye test</Button>
    </form>
  );
}
