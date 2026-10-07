"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { forwardRef, useId } from "react";
import { Icon } from "./Icon";

/**
 * Labelled field wrapper: label above, optional hint, inline error.
 * The input gets aria-describedby for hint + error and aria-invalid when in error.
 */
export function FieldShell({
  id, label, hint, error, warning, optional, children, className = "",
}: {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  warning?: string | null;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label} {optional ? <span className="font-normal text-muted">(optional)</span> : null}
      </label>
      {hint ? <p id={`${id}-hint`} className="text-sm text-muted">{hint}</p> : null}
      {children}
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            key="err"
            id={`${id}-error`}
            className="flex items-start gap-1.5 text-sm font-semibold text-danger"
            initial={reduce ? false : { opacity: 0, x: -6, height: 0 }}
            animate={{ opacity: 1, x: 0, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.p>
        ) : warning ? (
          <p key="warn" id={`${id}-warning`} className="flex items-start gap-1.5 text-sm text-warning">
            <Icon name="info" size={18} className="mt-0.5 shrink-0" />
            <span>{warning}</span>
          </p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export const describedBy = (id: string, hint?: unknown, error?: unknown, warning?: unknown) =>
  [hint ? `${id}-hint` : null, error ? `${id}-error` : warning ? `${id}-warning` : null].filter(Boolean).join(" ") || undefined;

const inputBase =
  "w-full min-h-[48px] rounded-xs border bg-surface px-3.5 text-base text-ink placeholder:text-muted/80 " +
  "transition-[border-color,box-shadow] duration-micro " +
  "hover:border-ink focus-visible:border-ink focus-visible:shadow-[0_0_0_1px_var(--c-ink)] " +
  "disabled:bg-sunk disabled:text-muted disabled:cursor-not-allowed";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  warning?: string | null;
  optional?: boolean;
  shellClassName?: string;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, warning, optional, id, shellClassName, className = "", suffix, ...rest },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell id={fid} label={label} hint={hint} error={error} warning={warning} optional={optional} className={shellClassName}>
      <div className="relative">
        <input
          ref={ref}
          id={fid}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fid, hint, error, warning)}
          className={`${inputBase} ${error ? "border-danger border-2" : "border-line-strong"} ${suffix ? "pr-12" : ""} ${className}`}
          {...rest}
        />
        {suffix ? <span className="num pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">{suffix}</span> : null}
      </div>
    </FieldShell>
  );
});

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  optional?: boolean;
  shellClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, optional, id, shellClassName, className = "", children, ...rest },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell id={fid} label={label} hint={hint} error={error} optional={optional} className={shellClassName}>
      <div className="relative">
        <select
          ref={ref}
          id={fid}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fid, hint, error)}
          className={`${inputBase} appearance-none pr-10 ${error ? "border-danger border-2" : "border-line-strong"} ${className}`}
          {...rest}
        >
          {children}
        </select>
        <Icon name="chevron-down" size={20} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
      </div>
    </FieldShell>
  );
});

/** Custom checkbox with a large target; native input kept for semantics. */
export function Checkbox({
  label, hint, checked, onChange, id, disabled, count,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
  disabled?: boolean;
  count?: number;
}) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={`group flex min-h-[44px] items-start gap-3 py-1.5 ${disabled ? "opacity-60" : ""}`}>
      <span className="relative mt-0.5 grid h-6 w-6 shrink-0 place-items-center">
        <input
          id={fid}
          type="checkbox"
          className="peer absolute inset-0 h-6 w-6 cursor-pointer appearance-none rounded-xs border-2 border-line-strong bg-surface transition-colors duration-micro checked:border-ink checked:bg-ink hover:border-ink disabled:cursor-not-allowed"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={hint ? `${fid}-hint` : undefined}
        />
        <Icon name="check" size={16} className="pointer-events-none relative text-paper opacity-0 transition-opacity duration-micro peer-checked:opacity-100" />
      </span>
      <label htmlFor={fid} className="flex flex-1 cursor-pointer flex-col">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-base">{label}</span>
          {count !== undefined ? <span className="num text-sm text-muted">{count}<span className="sr-only"> frames</span></span> : null}
        </span>
        {hint ? <span id={`${fid}-hint`} className="text-sm text-muted">{hint}</span> : null}
      </label>
    </div>
  );
}
