"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  FIELD_LABELS, UPLOAD_LIMIT_BYTES, formatPower, parsePower, validatePrescription,
  type FieldIssue, type FieldKey, type RawPrescription,
} from "@/lib/prescription";
import { api, ApiError, upload } from "@/lib/client/api";
import { Stepper } from "../ui/Stepper";
import { Button } from "../ui/Button";
import { Icon, type IconName } from "../ui/Icon";
import { ErrorSummary } from "../ui/ErrorSummary";
import { FieldShell, describedBy } from "../ui/Field";
import { reportTestError, reportTestEvent } from "../testmode/TestMode";

type Mode = "upload" | "manual" | "later";
const fid = (k: FieldKey) => `rx-${k.replace(".", "-")}`;

/** Ring that closes into a check: the "prescription checked" micro-interaction (SVG + motion, in place of Rive). */
export function CheckedMark({ size = 72 }: { size?: number }) {
  const reduce = useReducedMotion();
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" aria-hidden="true">
      <motion.circle cx="36" cy="36" r="31" fill="none" stroke="var(--c-accent)" strokeWidth="3" strokeLinecap="round"
        initial={{ pathLength: reduce ? 1 : 0, rotate: -90 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }} style={{ transformOrigin: "50% 50%" }} />
      <motion.circle cx="36" cy="36" r="24" fill="var(--c-accent-soft)"
        initial={{ scale: reduce ? 1 : 0 }} animate={{ scale: 1 }} transition={{ delay: reduce ? 0 : 0.45, type: "spring", stiffness: 500, damping: 18 }} style={{ transformOrigin: "50% 50%" }} />
      <motion.path d="m25 37 7.5 7.5L48 29" fill="none" stroke="var(--c-accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ delay: reduce ? 0 : 0.6, duration: 0.35 }} />
    </svg>
  );
}

export function PrescriptionFlow({
  itemId, productName, purpose, lensName, needsAdd,
}: { itemId: string; productName: string; purpose: string; lensName: string; needsAdd: boolean }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const reading = purpose === "reading";
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<Mode | null>(null);
  const [raw, setRaw] = useState<RawPrescription>({ right: {}, left: {} });
  const [touched, setTouched] = useState<Set<FieldKey>>(new Set());
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [warnings, setWarnings] = useState<FieldIssue[]>([]);
  const [summary, setSummary] = useState<FieldIssue[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);

  const steps = ["How to add it", mode === "upload" ? "Upload" : mode === "later" ? "Send later" : "Enter values", "Check and save"];

  const run = (r: RawPrescription) => {
    const v = validatePrescription(r, { purpose, needsAdd });
    setIssues(v.issues);
    setWarnings(v.warnings);
    return v;
  };

  const setVal = (k: FieldKey, value: string) => {
    const next: RawPrescription = JSON.parse(JSON.stringify(raw));
    if (k === "pd" || k === "readingPower") next[k] = value;
    else {
      const [eye, f] = k.split(".") as ["right" | "left", "sph" | "cyl" | "axis" | "add"];
      next[eye] = { ...next[eye], [f]: value };
    }
    setRaw(next);
    if (touched.has(k) || summary.length) run(next); // re-validate live once a field has been visited
  };
  const blur = (k: FieldKey) => {
    setTouched((t) => new Set(t).add(k));
    run(raw);
  };
  const errorFor = (k: FieldKey) => (touched.has(k) || summary.length ? issues.find((i) => i.field === k)?.message : undefined);
  const warnFor = (k: FieldKey) => warnings.find((i) => i.field === k)?.message;

  const goStep = (n: number) => {
    setStep(n);
    setServerError(null);
    window.setTimeout(() => stepHeading.current?.focus(), 50);
  };

  const continueFromEntry = () => {
    if (mode === "manual") {
      const v = run(raw);
      if (!v.ok) {
        setSummary(v.issues);
        setTouched(new Set(v.issues.map((i) => i.field)));
        reportTestError();
        window.setTimeout(() => summaryRef.current?.focus(), 30); // focus moves to the summary (recovery)
        return;
      }
      setSummary([]);
    }
    if (mode === "upload") {
      if (!file) { setFileError("Choose a photo or PDF of your prescription."); reportTestError(); return; }
    }
    goStep(2);
  };

  const save = async () => {
    setBusy(true);
    setServerError(null);
    try {
      if (mode === "upload" && file) {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("cartItemId", itemId);
        await upload("/api/prescriptions", fd);
      } else {
        await api("/api/prescriptions", { method: "POST", body: { mode: mode === "later" ? "later" : "manual", cartItemId: itemId, ...(mode === "manual" ? { values: raw } : {}) } });
      }
      setDone(true);
      reportTestEvent("T5");
      window.setTimeout(() => router.push("/cart"), reduce ? 600 : 1600);
    } catch (e) {
      if (e instanceof ApiError && e.fields && mode === "manual") {
        const list = Object.entries(e.fields).map(([field, message]) => ({ field: field as FieldKey, message }));
        setSummary(list);
        setIssues(list);
        goStep(1);
        window.setTimeout(() => summaryRef.current?.focus(), 80);
      } else if (e instanceof ApiError && e.fields?.file) {
        setFileError(e.fields.file);
        goStep(1);
      } else {
        setServerError(e instanceof ApiError ? e.message : "Couldn't save. Please try again.");
      }
      reportTestError();
    } finally {
      setBusy(false);
    }
  };

  // A render function, not a component: keeps input identity (and focus) stable while typing.
  const powerInput = ({ k, placeholder, inputMode = "decimal" }: { k: FieldKey; placeholder?: string; inputMode?: "decimal" | "numeric" }) => {
    const [eye, f] = k.includes(".") ? (k.split(".") as ["right" | "left", "sph" | "cyl" | "axis" | "add"]) : [null, null];
    const value = eye ? raw[eye]?.[f!] ?? "" : (raw[k as "pd" | "readingPower"] ?? "");
    const err = errorFor(k);
    const id = fid(k);
    return (
      <input
        id={id}
        value={value}
        inputMode={inputMode}
        autoComplete="off"
        placeholder={placeholder}
        aria-label={FIELD_LABELS[k]}
        aria-invalid={err ? true : undefined}
        aria-describedby={describedBy(id, false, err, warnFor(k))}
        onChange={(e) => setVal(k, e.target.value)}
        onBlur={() => blur(k)}
        className={`num min-h-[48px] w-full rounded-xs border bg-surface px-3 text-center text-base hover:border-ink focus-visible:border-ink ${err ? "border-2 border-danger" : "border-line-strong"}`}
      />
    );
  };

  const cols: { f: "sph" | "cyl" | "axis" | "add"; label: string; hint: string; placeholder: string; numeric?: boolean }[] = [
    { f: "sph", label: "SPH", hint: "Sphere, e.g. −1.25", placeholder: "−1.25" },
    { f: "cyl", label: "CYL", hint: "Cylinder; blank if none", placeholder: "0.00" },
    { f: "axis", label: "AXIS", hint: "1–180; only if CYL", placeholder: "90", numeric: true },
    ...(needsAdd ? [{ f: "add" as const, label: "ADD", hint: "+0.75 to +3.50", placeholder: "+1.50" }] : []),
  ];

  const options: { id: Mode; icon: IconName; title: string; body: string }[] = [
    { id: "upload", icon: "upload", title: "Upload a photo or PDF", body: "Our optometrist checks it before your lenses are made. JPG, PNG, WebP or PDF, up to 5 MB." },
    { id: "manual", icon: "edit", title: reading ? "Choose a reading power" : "Type it in", body: reading ? "One number, from +0.75 to +3.50." : "Copy the numbers from your prescription. We check each value as you go." },
    { id: "later", icon: "calendar", title: "Send it later, or book an eye test", body: "Place your order now. We'll email you to add it, or book a free eye test at a store." },
  ];

  const errorsForSummary = summary.map((i) => ({ fieldId: fid(i.field), message: `${FIELD_LABELS[i.field]}: ${i.message}` }));

  return (
    <div className="page grid-page gap-y-8 pb-16 pt-8 md:pt-12">
      <div className="col-span-4 md:col-span-8 xl:col-span-8">
        <p className="eyebrow">Lenses for {productName} · {lensName}</p>
        <h1 className="mt-2 font-display text-4xl">Add your prescription</h1>
        <p className="mt-3 flex items-start gap-2 border-l-2 border-warning bg-warning-soft px-3 py-2 text-sm font-semibold">
          <Icon name="info" size={18} className="mt-0.5 shrink-0 text-warning" /> Demo only. Do not upload or enter a real prescription.
        </p>
        <div className="mt-6"><Stepper steps={steps} current={done ? 3 : step} label="Prescription steps" /></div>

        <div className="mt-8">
          <AnimatePresence mode="wait" initial={false}>
            {done ? (
              <motion.div key="done" initial={reduce ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-start gap-4 border border-ink bg-surface p-6 md:p-10" role="status">
                <CheckedMark />
                <h2 className="font-display text-3xl">{mode === "later" ? "Noted. Add it any time before we make your lenses." : mode === "upload" ? "Uploaded. Our optometrist will check it." : "Prescription saved and checked."}</h2>
                <p className="text-muted">Taking you to your bag…</p>
                <Link href="/cart" className="link">Go to bag now</Link>
              </motion.div>
            ) : step === 0 ? (
              <motion.fieldset key="s0" initial={reduce ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}>
                <legend className="sr-only">How would you like to add your prescription?</legend>
                <h2 ref={stepHeading} tabIndex={-1} className="font-display text-2xl">How would you like to add it?</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {options.map((o) => (
                    <label key={o.id} className="relative flex cursor-pointer flex-col gap-3 border border-line-strong bg-surface p-5 transition-colors duration-micro hover:border-ink has-[:checked]:border-ink has-[:checked]:bg-accent-soft has-[:checked]:shadow-lift-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus">
                      <input type="radio" name="rx-mode" className="sr-only" checked={mode === o.id} onChange={() => setMode(o.id)} data-testid={`rx-mode-${o.id}`} />
                      <Icon name={o.icon} size={28} className="text-accent" />
                      <span className="font-bold">{o.title}</span>
                      <span className="text-sm text-muted">{o.body}</span>
                      {mode === o.id ? <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-ink text-paper"><Icon name="check" size={14} /></span> : null}
                    </label>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button variant="primary" iconRight="arrow-right" disabled={!mode} onClick={() => goStep(1)}>Continue</Button>
                  <Link href="/cart" className="inline-flex min-h-[48px] items-center px-3 font-semibold text-muted underline-offset-4 hover:text-ink hover:underline">Skip for now, go to bag</Link>
                </div>
              </motion.fieldset>
            ) : step === 1 ? (
              <motion.div key="s1" initial={reduce ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }} className="flex flex-col gap-6">
                <h2 ref={stepHeading} tabIndex={-1} className="font-display text-2xl">{steps[1]}</h2>
                <ErrorSummary ref={summaryRef} items={errorsForSummary} title={`${summary.length} ${summary.length === 1 ? "value needs" : "values need"} checking`} />

                {mode === "manual" && !reading ? (
                  <form noValidate onSubmit={(e) => { e.preventDefault(); continueFromEntry(); }} className="flex flex-col gap-6">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px] border-separate border-spacing-x-2 border-spacing-y-2">
                        <caption className="sr-only">Prescription values for each eye</caption>
                        <thead>
                          <tr>
                            <td />
                            {cols.map((c) => (
                              <th key={c.f} scope="col" className="text-left align-bottom">
                                <span className="num block font-bold">{c.label}</span>
                                <span className="block text-xs font-normal text-muted">{c.hint}</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(["right", "left"] as const).map((eye) => (
                            <tr key={eye}>
                              <th scope="row" className="pr-2 text-left align-top">
                                <span className="block pt-3 font-bold">{eye === "right" ? "Right eye" : "Left eye"}</span>
                                <span className="num block text-xs text-muted">{eye === "right" ? "OD" : "OS"}</span>
                              </th>
                              {cols.map((c) => (
                                <td key={c.f} className="align-top">
                                  {powerInput({ k: `${eye}.${c.f}` as FieldKey, inputMode: c.numeric ? "numeric" : "decimal" })}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Inline messages per eye, next to the table (errors animate in) */}
                    <div className="flex flex-col gap-1">
                      {(["right", "left"] as const).flatMap((eye) => cols.map((c) => `${eye}.${c.f}` as FieldKey)).map((k) => {
                        const err = errorFor(k);
                        const warn = warnFor(k);
                        return (
                          <AnimatePresence key={k} initial={false}>
                            {err || warn ? (
                              <motion.p
                                id={`${fid(k)}-${err ? "error" : "warning"}`}
                                initial={reduce ? false : { opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className={`flex items-start gap-1.5 text-sm ${err ? "font-semibold text-danger" : "text-warning"}`}
                              >
                                <Icon name={err ? "alert" : "info"} size={18} className="mt-0.5 shrink-0" /> {err ?? warn}
                              </motion.p>
                            ) : null}
                          </AnimatePresence>
                        );
                      })}
                    </div>
                    <div className="max-w-md">
                      <FieldShell id={fid("pd")} label="Pupillary distance (PD)" hint="Distance between pupils in mm, e.g. 62. Often written as PD." error={errorFor("pd")}>
                        {powerInput({ k: "pd", inputMode: "decimal" })}
                      </FieldShell>
                    </div>
                    <details className="max-w-prose text-sm">
                      <summary className="min-h-[44px] cursor-pointer py-2 font-semibold text-accent">Where do I find these numbers?</summary>
                      <p className="text-muted">Your prescription has a row for each eye: OD (right) and OS (left). SPH is the main power (minus for distance, plus for near). CYL and AXIS correct astigmatism and always come together. ADD appears on prescriptions for progressive or reading lenses.</p>
                    </details>
                    <div className="flex flex-wrap gap-3">
                      <Button type="button" variant="secondary" icon="arrow-left" onClick={() => goStep(0)}>Back</Button>
                      <Button type="submit" variant="primary" iconRight="arrow-right" data-testid="rx-continue">Check my values</Button>
                    </div>
                  </form>
                ) : mode === "manual" && reading ? (
                  <form noValidate onSubmit={(e) => { e.preventDefault(); continueFromEntry(); }} className="flex max-w-sm flex-col gap-6">
                    <FieldShell id={fid("readingPower")} label="Reading power" hint="A plus number from +0.75 to +3.50, in steps of 0.25. Not sure? +1.50 is a common start; a free eye test will tell you." error={errorFor("readingPower")}>
                      {powerInput({ k: "readingPower",  placeholder: "+1.50" })}
                    </FieldShell>
                    <div className="flex flex-wrap gap-3">
                      <Button type="button" variant="secondary" icon="arrow-left" onClick={() => goStep(0)}>Back</Button>
                      <Button type="submit" variant="primary" iconRight="arrow-right">Check my value</Button>
                    </div>
                  </form>
                ) : mode === "upload" ? (
                  <div className="flex max-w-xl flex-col gap-4">
                    <FieldShell id="rx-file" label="Photo or PDF of your prescription" hint="JPG, PNG, WebP or PDF, up to 5 MB. Make sure all numbers are readable." error={fileError}>
                      <input
                        id="rx-file"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        aria-invalid={fileError ? true : undefined}
                        aria-describedby={describedBy("rx-file", true, fileError)}
                        className="block min-h-[56px] w-full cursor-pointer border border-dashed border-line-strong bg-surface p-3 file:mr-4 file:min-h-[40px] file:cursor-pointer file:border file:border-ink file:bg-paper file:px-4 file:font-semibold hover:border-ink"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setFileError(null);
                          if (f && f.size > UPLOAD_LIMIT_BYTES) { setFileError("That file is larger than 5 MB. Try a smaller photo or a screenshot."); setFile(null); return; }
                          if (f && !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(f.type)) { setFileError("Only JPG, PNG, WebP or PDF files can be uploaded."); setFile(null); return; }
                          setFile(f);
                        }}
                      />
                    </FieldShell>
                    {file ? <p className="flex items-center gap-2 text-sm"><Icon name="check" size={18} className="text-success" /> {file.name} · {(file.size / 1024).toFixed(0)} KB</p> : null}
                    <div className="flex flex-wrap gap-3">
                      <Button variant="secondary" icon="arrow-left" onClick={() => goStep(0)}>Back</Button>
                      <Button variant="primary" iconRight="arrow-right" onClick={continueFromEntry}>Continue</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex max-w-xl flex-col gap-4">
                    <p>You can place your order now. Before we make your lenses, we&apos;ll email you a link to add your prescription. Lenses are only made after that.</p>
                    <p className="text-muted">Don&apos;t have a recent prescription? A free 20-minute eye test is available at most stores.</p>
                    <Link href="/stores" className="link self-start" target="_blank">Book a free eye test (opens in a new tab)</Link>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="secondary" icon="arrow-left" onClick={() => goStep(0)}>Back</Button>
                      <Button variant="primary" iconRight="arrow-right" onClick={() => goStep(2)}>Continue</Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="s2" initial={reduce ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }} className="flex flex-col gap-6">
                <h2 ref={stepHeading} tabIndex={-1} className="font-display text-2xl">Check and save</h2>
                {mode === "manual" && !reading ? (
                  <table className="w-full max-w-xl border-collapse text-left">
                    <caption className="sr-only">Your prescription values</caption>
                    <thead><tr className="border-b border-ink"><td />{cols.map((c) => <th key={c.f} scope="col" className="num py-2">{c.label}</th>)}</tr></thead>
                    <tbody className="num">
                      {(["right", "left"] as const).map((eye) => (
                        <tr key={eye} className="border-b border-line">
                          <th scope="row" className="py-2 font-sans">{eye === "right" ? "Right (OD)" : "Left (OS)"}</th>
                          {cols.map((c) => {
                            const v = raw[eye]?.[c.f] ?? "";
                            const n = c.f === "axis" ? v : parsePower(v);
                            return <td key={c.f}>{c.f === "axis" ? (v || "—") : n === null ? (c.f === "cyl" ? "0.00" : "—") : formatPower(n as number)}</td>;
                          })}
                        </tr>
                      ))}
                      <tr><th scope="row" className="py-2 font-sans">PD</th><td colSpan={cols.length}>{raw.pd} mm</td></tr>
                    </tbody>
                  </table>
                ) : mode === "manual" ? (
                  <p className="text-lg">Reading power: <strong className="num">{formatPower(parsePower(raw.readingPower) ?? 0)}</strong></p>
                ) : mode === "upload" ? (
                  <p className="text-lg">File: <strong>{file?.name}</strong>. Our optometrist will read it and contact you if anything is unclear.</p>
                ) : (
                  <p className="text-lg">You&apos;ll add your prescription after ordering. We won&apos;t make lenses until you do.</p>
                )}
                {warnings.length && mode === "manual" ? (
                  <ul className="flex flex-col gap-1 border-l-2 border-warning bg-warning-soft p-3 text-sm">
                    {warnings.map((w) => <li key={w.field + w.message}>{w.message}</li>)}
                  </ul>
                ) : null}
                {serverError ? (
                  <div role="alert" className="flex flex-wrap items-center gap-3 border-2 border-danger bg-danger-soft p-3">
                    <Icon name="alert" className="text-danger" /> <p className="flex-1 font-semibold">{serverError}</p>
                    <Button variant="secondary" size="sm" icon="rotate" onClick={save}>Retry</Button>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" icon="edit" onClick={() => goStep(mode === "later" ? 0 : 1)}>Change</Button>
                  <Button variant="primary" iconRight="arrow-right" onClick={save} loading={busy} loadingText="Saving" data-testid="rx-save">Save and go to bag</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <aside className="col-span-4 md:col-span-8 xl:col-span-4" aria-label="Help with prescriptions">
        <div className="border border-line bg-surface p-5">
          <h2 className="font-sans text-lg font-bold">Your prescription is private</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-muted">
            <li className="flex gap-2"><Icon name="lock" size={18} className="shrink-0 text-accent" /> Only our optometrists see it, to make your lenses.</li>
            <li className="flex gap-2"><Icon name="eye" size={18} className="shrink-0 text-accent" /> A qualified optometrist checks every prescription.</li>
            <li className="flex gap-2"><Icon name="return" size={18} className="shrink-0 text-accent" /> If the lenses don&apos;t feel right, we remake them free within 14 days.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
