"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "../ui/Icon";

/**
 * Moderated usability-test helper. Hidden unless the URL has ?test=1
 * (remembered for the browser tab; ?test=0 turns it off).
 * Logs task, outcome, time and error count to localStorage only. Nothing is sent anywhere.
 */
const TASKS = [
  { id: "T1", label: "Find a suitable frame for your need", auto: (p: string) => p.startsWith("/frames/") },
  { id: "T2", label: "Use Frame Finder or filters to narrow options", auto: (_p: string, q: string) => _p === "/shop" && /(shape|size|price|material|frameType|face)=/.test(q) },
  { id: "T3", label: "Compare 2–3 frames and choose one", auto: (p: string, _q: string, prev: string) => p.startsWith("/frames/") && prev === "/compare" },
  { id: "T4", label: "Pick lens purpose and size on the product page", auto: () => false },
  { id: "T5", label: "Enter a prescription (and recover from an error)", auto: () => false },
  { id: "T6", label: "Check out as a guest and reach confirmation", auto: (p: string) => p.startsWith("/order/") },
] as const;

interface LogEntry { task: string; outcome: "success" | "fail" | "abandoned"; ms: number; errors: number; at: string; endPath: string }

/** Forms call this when they show a validation error, so test mode can count errors. */
export function reportTestError() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("cp:test-error"));
}
/** Product page / prescription flow call this to mark auto-success for T4/T5. */
export function reportTestEvent(name: "T4" | "T5") {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("cp:test-event", { detail: name }));
}

function TestModeInner() {
  const params = useSearchParams();
  const pathname = usePathname();
  const [on, setOn] = useState(false);
  const [open, setOpen] = useState(true);
  const [task, setTask] = useState<string>("T1");
  const [start, setStart] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [errors, setErrors] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const prevPath = useRef(pathname);

  useEffect(() => {
    const t = params.get("test");
    try {
      if (t === "1") sessionStorage.setItem("cp_test", "1");
      if (t === "0") sessionStorage.removeItem("cp_test");
      setOn(sessionStorage.getItem("cp_test") === "1");
      setLog(JSON.parse(localStorage.getItem("cp_testlog") ?? "[]"));
    } catch {
      setOn(t === "1");
    }
  }, [params]);

  const finish = useCallback(
    (outcome: LogEntry["outcome"]) => {
      if (start === null) return;
      const entry: LogEntry = { task, outcome, ms: Date.now() - start, errors, at: new Date().toISOString(), endPath: window.location.pathname + window.location.search };
      setLog((l) => {
        const next = [...l, entry];
        try { localStorage.setItem("cp_testlog", JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
      setStart(null);
    },
    [start, task, errors],
  );

  // Timer tick
  useEffect(() => {
    if (start === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [start]);

  // Error counting and explicit events
  useEffect(() => {
    const onErr = () => setErrors((e) => e + 1);
    const onEvt = (e: Event) => {
      if (start !== null && (e as CustomEvent).detail === task) finish("success");
    };
    window.addEventListener("cp:test-error", onErr);
    window.addEventListener("cp:test-event", onEvt);
    return () => {
      window.removeEventListener("cp:test-error", onErr);
      window.removeEventListener("cp:test-event", onEvt);
    };
  }, [start, task, finish]);

  // Route-based auto success
  useEffect(() => {
    const prev = prevPath.current;
    prevPath.current = pathname;
    if (start === null) return;
    const t = TASKS.find((x) => x.id === task);
    if (t && t.auto(pathname, params.toString(), prev)) finish("success");
  }, [pathname, params, start, task, finish]);

  if (!on) return null;
  const elapsed = start ? Math.floor((now - start) / 1000) : 0;
  const download = () => {
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `clear-path-test-log-${Date.now()}.json`;
    a.click();
  };

  return (
    <aside aria-label="Test mode panel" className="fixed left-3 top-[calc(var(--header-h)+12px)] z-toast w-[300px] border-2 border-signal bg-surface text-sm shadow-lift">
      <div className="flex items-center justify-between bg-signal px-3 py-1.5 text-white">
        <span className="flex items-center gap-2 font-bold"><Icon name="timer" size={18} /> Test mode</span>
        <button className="min-h-[36px] px-2 font-semibold underline" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? "Hide" : "Show"}</button>
      </div>
      {open ? (
        <div className="flex flex-col gap-2 p-3">
          <label className="font-semibold" htmlFor="tm-task">Task</label>
          <select id="tm-task" className="min-h-[40px] border border-line-strong bg-surface px-2" value={task} disabled={start !== null} onChange={(e) => setTask(e.target.value)}>
            {TASKS.map((t) => <option key={t.id} value={t.id}>{t.id}: {t.label}</option>)}
          </select>
          <p className="num text-3xl" aria-live="off">{String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}</p>
          <p className="text-muted">Errors seen: <span className="num font-bold text-ink">{errors}</span></p>
          {start === null ? (
            <button className="min-h-[40px] bg-ink font-semibold text-paper" onClick={() => { setErrors(0); setStart(Date.now()); setNow(Date.now()); }}>Start task</button>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              <button className="min-h-[40px] bg-success font-semibold text-white" onClick={() => finish("success")}>Success</button>
              <button className="min-h-[40px] bg-danger font-semibold text-white" onClick={() => finish("fail")}>Fail</button>
              <button className="min-h-[40px] border border-ink font-semibold" onClick={() => finish("abandoned")}>Gave up</button>
            </div>
          )}
          <details>
            <summary className="cursor-pointer py-1 font-semibold">Log ({log.length})</summary>
            <ol className="mt-1 max-h-40 overflow-auto">
              {log.map((l, i) => (
                <li key={i} className="num border-b border-line py-1 text-xs">{l.task} · {l.outcome} · {(l.ms / 1000).toFixed(1)}s · {l.errors} err</li>
              ))}
            </ol>
            <div className="mt-2 flex gap-2">
              <button className="min-h-[36px] border border-ink px-2 font-semibold" onClick={download}>Export JSON</button>
              <button className="min-h-[36px] px-2 text-danger underline" onClick={() => { setLog([]); try { localStorage.removeItem("cp_testlog"); } catch { /* ignore */ } }}>Clear log</button>
            </div>
          </details>
          <p className="text-xs text-muted">Stored only in this browser. Nothing is sent anywhere.</p>
        </div>
      ) : null}
    </aside>
  );
}

export function TestMode() {
  return (
    <Suspense fallback={null}>
      <TestModeInner />
    </Suspense>
  );
}
