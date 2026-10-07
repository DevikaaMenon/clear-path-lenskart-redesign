"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FACE_ANSWERS, FIT_ANSWERS, type FinderAnswers } from "@/lib/finder";
import { NEEDS } from "@/lib/taxonomy";
import { NEED_ICON } from "@/lib/nav";
import { api, ApiError } from "@/lib/client/api";
import { useShop } from "../providers/ShopProvider";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

const STEP_TITLES = ["What are the glasses for?", "What shape is your face?", "How do glasses usually fit you?"];
const STORE_KEY = "cp_finder";

type Answers = { need: FinderAnswers["need"]; face: FinderAnswers["face"]; fit: FinderAnswers["fit"] };

function FaceGlyph({ id }: { id: string }) {
  const d: Record<string, React.ReactNode> = {
    round: <circle cx="24" cy="26" r="15" />,
    oval: <ellipse cx="24" cy="26" rx="13" ry="17" />,
    square: <rect x="10" y="10" width="28" height="31" rx="6" />,
    heart: <path d="M9 14q15-6 30 0q1 14-6 22q-5 6-9 6t-9-6q-7-8-6-22Z" />,
    long: <ellipse cx="24" cy="26" rx="11" ry="19" />,
    unsure: <><circle cx="24" cy="26" r="15" strokeDasharray="3 4" /><path d="M20 22a4 4 0 1 1 5 4v3M24 33v.1" /></>,
  };
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      {d[id]}
    </svg>
  );
}

function FitGlyph({ id }: { id: string }) {
  const d: Record<string, React.ReactNode> = {
    tight: <><path d="M14 24h20" /><path d="m6 18 6 6-6 6M42 18l-6 6 6 6" /></>,
    fine: <><path d="M10 24h28" /><path d="m17 31 5 5 10-10" /></>,
    loose: <><path d="M10 18h28" /><path d="M24 22v14m-5-5 5 5 5-5" /></>,
    unsure: <><circle cx="24" cy="24" r="14" strokeDasharray="3 4" /><path d="M20 20a4 4 0 1 1 5 4v3M24 31v.1" /></>,
  };
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d[id]}
    </svg>
  );
}

export function FrameFinder({ kids = false }: { kids?: boolean }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { need: shopNeed, setNeed } = useShop();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [answers, setAnswers] = useState<Answers>({ need: null, face: null, fit: null });
  const [result, setResult] = useState<{ total: number; href: string; notes: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Focus the new question once it has actually mounted (after the exit animation).
  const wantFocus = useRef(false);
  const headingRef = (el: HTMLHeadingElement | null) => {
    if (el && wantFocus.current) {
      wantFocus.current = false;
      el.focus();
    }
  };

  // Restore earlier answers (so Back from the listing keeps them), else pre-fill the need.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) ?? "null");
      if (saved) { setAnswers(saved.answers); setStep(Math.min(saved.step ?? 0, 2)); return; }
    } catch { /* ignore */ }
    if (shopNeed && shopNeed !== "contacts") setAnswers((a) => ({ ...a, need: shopNeed as Answers["need"] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ answers, step })); } catch { /* ignore */ }
  }, [answers, step]);

  const go = (to: number) => {
    wantFocus.current = true;
    setDir(to > step ? 1 : -1);
    setStep(to);
  };

  const finish = async (a: Answers) => {
    setLoading(true);
    setError(null);
    try {
      const r = await api<{ total: number; href: string; notes: string[] }>("/api/finder", { method: "POST", body: { ...a, ...(kids ? { audience: "kids" } : {}) }, retry: true });
      wantFocus.current = true;
      setDir(1);
      setResult(r);
      if (a.need) setNeed(a.need);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const next = () => (step < 2 ? go(step + 1) : finish(answers));
  const skip = () => {
    const key = (["need", "face", "fit"] as const)[step];
    const a = { ...answers, [key]: null };
    setAnswers(a);
    if (step < 2) go(step + 1); else finish(a);
  };

  const options =
    step === 0
      ? NEEDS.filter((n) => n.id !== "contacts").map((n) => ({ id: n.id, label: n.label, helper: n.helper, glyph: <Icon name={NEED_ICON[n.id]} size={36} /> }))
      : step === 1
        ? FACE_ANSWERS.map((f) => ({ id: f.id, label: f.label, helper: f.helper, glyph: <FaceGlyph id={f.id} /> }))
        : FIT_ANSWERS.map((f) => ({ id: f.id, label: f.label, helper: f.helper, glyph: <FitGlyph id={f.id} /> }));
  const key = (["need", "face", "fit"] as const)[step];
  const value = answers[key];
  const progress = result ? 1 : step / 3;

  const variants = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { x: d * 56, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => (reduce ? { opacity: 0 } : { x: d * -56, opacity: 0 }),
  };

  return (
    <div className="page grid-page gap-y-8 pb-16 pt-10 md:pt-14">
      <div className="col-span-4 md:col-span-8 xl:col-span-4">
        <p className="eyebrow">Frame Finder{kids ? " · Kids" : ""}</p>
        <h1 className="mt-3 font-display text-5xl">Find my frame</h1>
        <p className="mt-4 max-w-[40ch] text-lg text-muted">Three quick questions. Skip any you&apos;re unsure about. You&apos;ll see matching frames you can still filter.</p>

        {/* Progress: fills as you go */}
        <div className="mt-8" aria-hidden="true">
          <div className="flex justify-between text-sm">
            {STEP_TITLES.map((t, i) => (
              <span key={t} className={`num ${i <= step || result ? "text-ink" : "text-muted"}`}>0{i + 1}</span>
            ))}
            <span className={`num ${result ? "text-ink" : "text-muted"}`}>✓</span>
          </div>
          <div className="mt-2 h-[3px] w-full bg-line">
            <motion.div className="h-full origin-left bg-accent" animate={{ scaleX: progress }} initial={false} transition={{ duration: reduce ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }} />
          </div>
        </div>
        <p className="sr-only" aria-live="polite">{result ? "Results ready" : `Question ${step + 1} of 3`}</p>

        {/* Answers so far */}
        <dl className="mt-8 hidden flex-col gap-2 text-sm xl:flex">
          {(["need", "face", "fit"] as const).map((k, i) => (
            <div key={k} className="flex justify-between gap-4 border-b border-line pb-2">
              <dt className="text-muted">{["For", "Face", "Fit"][i]}</dt>
              <dd className="font-semibold">
                {answers[k]
                  ? (k === "need" ? NEEDS.find((n) => n.id === answers[k])?.short : k === "face" ? FACE_ANSWERS.find((f) => f.id === answers[k])?.label : FIT_ANSWERS.find((f) => f.id === answers[k])?.label)
                  : <span className="font-normal text-muted">Skipped / not yet</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="col-span-4 md:col-span-8 xl:col-span-8 xl:col-start-5">
        <div className="relative overflow-hidden border border-ink bg-surface">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            {result ? (
              <motion.div key="result" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }} className="p-6 md:p-10">
                <p className="eyebrow">Your matches</p>
                <h2 ref={headingRef} tabIndex={-1} className="mt-3 font-display text-4xl">
                  {result.total === 0 ? "No exact matches" : <>We found <span className="num text-accent">{result.total}</span> {result.total === 1 ? "frame" : "frames"} for you</>}
                </h2>
                {result.notes.map((n) => <p key={n} className="mt-3 flex gap-2 text-muted"><Icon name="info" size={20} className="mt-0.5 shrink-0" />{n}</p>)}
                <p className="mt-3 text-muted">They&apos;re all in stock. You can change or remove any filter on the next page.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button variant="primary" size="lg" iconRight="arrow-right" onClick={() => router.push(result.href)} data-testid="finder-see-results">
                    Show my {result.total} {result.total === 1 ? "frame" : "frames"}
                  </Button>
                  <Button variant="secondary" size="lg" onClick={() => { wantFocus.current = true; setResult(null); setDir(-1); setStep(2); }}>Change my answers</Button>
                </div>
              </motion.div>
            ) : (
              <motion.fieldset key={step} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }} className="p-6 md:p-10">
                <legend className="sr-only">{STEP_TITLES[step]}</legend>
                <p className="num text-sm text-muted">Question {step + 1} of 3</p>
                <h2 ref={headingRef} tabIndex={-1} className="mt-2 font-display text-4xl">{STEP_TITLES[step]}</h2>
                {step === 1 ? <p className="mt-2 text-muted">Look straight into a mirror or your front camera. Pick the closest; it only guides suggestions.</p> : null}
                <div className={`mt-6 grid gap-3 ${step === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`} role="radiogroup" aria-label={STEP_TITLES[step]}>
                  {options.map((o) => {
                    const sel = value === o.id;
                    return (
                      <motion.label
                        key={o.id}
                        whileTap={reduce ? undefined : { scale: 0.97 }}
                        animate={sel && !reduce ? { scale: [1, 1.025, 1] } : { scale: 1 }}
                        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                        className={`relative flex min-h-[88px] cursor-pointer items-start gap-4 border p-4 transition-colors duration-micro has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${sel ? "border-ink bg-accent-soft shadow-lift-sm" : "border-line-strong bg-paper hover:border-ink"}`}
                      >
                        <input
                          type="radio"
                          name={`finder-${key}`}
                          value={o.id}
                          checked={sel}
                          onChange={() => setAnswers((a) => ({ ...a, [key]: o.id }))}
                          className="sr-only"
                        />
                        <span className={`shrink-0 ${sel ? "text-accent" : "text-ink"}`}>{o.glyph}</span>
                        <span>
                          <span className="block font-semibold">{o.label}</span>
                          <span className="block text-sm text-muted">{o.helper}</span>
                        </span>
                        <AnimatePresence>
                          {sel ? (
                            <motion.span
                              initial={reduce ? false : { scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ type: "spring", stiffness: 600, damping: 20 }}
                              className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-ink text-paper"
                              aria-hidden="true"
                            >
                              <Icon name="check" size={14} />
                            </motion.span>
                          ) : null}
                        </AnimatePresence>
                      </motion.label>
                    );
                  })}
                </div>
                {error ? <p role="alert" className="mt-4 flex items-center gap-2 font-semibold text-danger"><Icon name="alert" size={20} />{error}</p> : null}
                <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-6">
                  <Button variant="secondary" icon="arrow-left" onClick={() => go(step - 1)} disabled={step === 0}>Back</Button>
                  <button className="min-h-[48px] px-3 font-semibold text-muted underline-offset-4 hover:text-ink hover:underline" onClick={skip}>
                    Skip this question
                  </button>
                  <Button variant="primary" iconRight="arrow-right" className="ml-auto" onClick={next} disabled={!value} loading={loading} loadingText="Finding frames">
                    {step < 2 ? "Next question" : "See my frames"}
                  </Button>
                </div>
              </motion.fieldset>
            )}
          </AnimatePresence>
        </div>
        <p className="mt-4 text-sm text-muted">
          Prefer to browse? <Link href="/shop" className="link">See all frames</Link> or <Link href="/help#size" className="link">read the size guide</Link>.
        </p>
      </div>
    </div>
  );
}
