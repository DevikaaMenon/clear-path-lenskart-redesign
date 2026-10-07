/**
 * Prescription validation, shared by the form (inline) and the API (authoritative).
 * Messages are plain language and say how to fix the problem.
 * Values are never logged.
 */
import { z } from "zod";

export const RANGES = {
  sph: { min: -20, max: 20, step: 0.25, unusual: 10 },
  cyl: { min: -6, max: 6, step: 0.25 },
  axis: { min: 1, max: 180 },
  add: { min: 0.75, max: 3.5, step: 0.25 },
  pd: { min: 50, max: 80 },
  reading: { min: 0.75, max: 3.5, step: 0.25 },
} as const;

export type EyeKey = "right" | "left";
export type FieldKey =
  | "right.sph" | "right.cyl" | "right.axis" | "right.add"
  | "left.sph" | "left.cyl" | "left.axis" | "left.add"
  | "pd" | "readingPower";

export const FIELD_LABELS: Record<FieldKey, string> = {
  "right.sph": "Right eye (OD): Sphere (SPH)",
  "right.cyl": "Right eye (OD): Cylinder (CYL)",
  "right.axis": "Right eye (OD): Axis",
  "right.add": "Right eye (OD): Addition (ADD)",
  "left.sph": "Left eye (OS): Sphere (SPH)",
  "left.cyl": "Left eye (OS): Cylinder (CYL)",
  "left.axis": "Left eye (OS): Axis",
  "left.add": "Left eye (OS): Addition (ADD)",
  pd: "Pupillary distance (PD)",
  readingPower: "Reading power",
};

export interface FieldIssue { field: FieldKey; message: string }

export interface EyeValues { sph: number; cyl: number; axis: number | null; add: number | null }
export interface PrescriptionValues {
  kind: "full" | "reading";
  right?: EyeValues;
  left?: EyeValues;
  pd?: number;
  readingPower?: number;
}

export type RawEye = { sph?: string; cyl?: string; axis?: string; add?: string };
export type RawPrescription = { right?: RawEye; left?: RawEye; pd?: string; readingPower?: string };

const fmt = (n: number) => (n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2));

/** "+1.25", "-1,25", "1.25", " 1.5 " → number; "" → null; garbage → NaN */
export function parsePower(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const s = raw.trim().replace(",", ".").replace(/^\+/, "").replace(/\s+/g, "");
  if (s === "") return null;
  if (!/^-?\d{1,2}(\.\d{1,2})?$/.test(s)) return NaN;
  return Number(s);
}

const isStep = (n: number, step: number) => Math.abs(n / step - Math.round(n / step)) < 1e-9;

function checkPower(
  v: number | null, field: FieldKey, r: { min: number; max: number; step: number }, name: string, required: boolean,
  issues: FieldIssue[],
): number | null {
  if (v === null) {
    if (required) issues.push({ field, message: `Enter the ${name}. If your prescription leaves it blank, enter 0.` });
    return null;
  }
  if (Number.isNaN(v)) {
    issues.push({ field, message: `${name} must be a number like -1.25 or +2.00.` });
    return null;
  }
  if (v < r.min || v > r.max) {
    issues.push({ field, message: `${name} must be between ${fmt(r.min)} and ${fmt(r.max)}. Check you copied it from the right box.` });
    return null;
  }
  if (!isStep(v, r.step)) {
    issues.push({ field, message: `${name} comes in steps of 0.25 (for example ${fmt(Math.round(v * 4) / 4)}).` });
    return null;
  }
  return v;
}

function validateEye(eye: EyeKey, raw: RawEye | undefined, withAdd: boolean, issues: FieldIssue[], warnings: FieldIssue[]): EyeValues | undefined {
  const label = eye === "right" ? "right eye" : "left eye";
  const sph = checkPower(parsePower(raw?.sph), `${eye}.sph`, RANGES.sph, `Sphere for the ${label}`, true, issues);
  const cyl = checkPower(parsePower(raw?.cyl) ?? 0, `${eye}.cyl`, RANGES.cyl, `Cylinder for the ${label}`, false, issues);

  let axis: number | null = null;
  const axisRaw = raw?.axis?.trim() ?? "";
  if (cyl !== null && cyl !== 0) {
    if (axisRaw === "") {
      issues.push({ field: `${eye}.axis`, message: `Axis is needed for the ${label} because cylinder is not 0. It is a whole number from 1 to 180.` });
    } else if (!/^\d{1,3}$/.test(axisRaw) || +axisRaw < RANGES.axis.min || +axisRaw > RANGES.axis.max) {
      issues.push({ field: `${eye}.axis`, message: `Axis for the ${label} must be a whole number from 1 to 180.` });
    } else axis = +axisRaw;
  } else if (axisRaw !== "") {
    warnings.push({ field: `${eye}.axis`, message: `Axis is ignored for the ${label} because cylinder is 0.` });
  }

  let add: number | null = null;
  if (withAdd) {
    add = checkPower(parsePower(raw?.add), `${eye}.add`, RANGES.add, `Addition for the ${label}`, true, issues);
  }

  if (sph !== null && Math.abs(sph) >= RANGES.sph.unusual) {
    warnings.push({ field: `${eye}.sph`, message: `${fmt(sph)} is a high power. Please double-check it. We'll suggest thin lenses for powers above ±4.00.` });
  }
  if (sph === null || cyl === null) return undefined;
  return { sph, cyl, axis, add };
}

export interface ValidationResult {
  ok: boolean;
  values?: PrescriptionValues;
  issues: FieldIssue[];
  warnings: FieldIssue[];
}

/**
 * @param purpose lens purpose; "reading" asks only for a reading power
 * @param needsAdd progressive lenses need ADD for both eyes
 */
export function validatePrescription(raw: RawPrescription, opts: { purpose: string; needsAdd?: boolean }): ValidationResult {
  const issues: FieldIssue[] = [];
  const warnings: FieldIssue[] = [];

  if (opts.purpose === "reading") {
    const rp = checkPower(parsePower(raw.readingPower), "readingPower", RANGES.reading, "Reading power", true, issues);
    if (rp !== null && rp <= 0) issues.push({ field: "readingPower", message: "Reading power is a plus number, like +1.50." });
    return issues.length
      ? { ok: false, issues, warnings }
      : { ok: true, issues, warnings, values: { kind: "reading", readingPower: rp! } };
  }

  const right = validateEye("right", raw.right, !!opts.needsAdd, issues, warnings);
  const left = validateEye("left", raw.left, !!opts.needsAdd, issues, warnings);

  let pd: number | undefined;
  const pdRaw = raw.pd?.trim() ?? "";
  if (pdRaw === "") {
    issues.push({ field: "pd", message: "Enter your PD (the distance between your pupils, in mm). It's usually between 54 and 74. Don't know it? Choose “Send later” and we'll measure it free at a store." });
  } else if (!/^\d{2}(\.5)?$/.test(pdRaw)) {
    issues.push({ field: "pd", message: "PD is a number of millimetres like 62 or 62.5." });
  } else if (+pdRaw < RANGES.pd.min || +pdRaw > RANGES.pd.max) {
    issues.push({ field: "pd", message: `PD must be between ${RANGES.pd.min} and ${RANGES.pd.max} mm. Most adults are between 54 and 74.` });
  } else pd = +pdRaw;

  // Sanity check across eyes: very different powers are possible but worth a second look.
  if (right && left && Math.abs(right.sph - left.sph) >= 3) {
    warnings.push({ field: "left.sph", message: "Your two eyes have quite different powers. That can be correct, but please check you didn't swap a sign (+/−)." });
  }

  if (issues.length) return { ok: false, issues, warnings };
  return { ok: true, issues, warnings, values: { kind: "full", right, left, pd } };
}

/** Server-side request schema (shape only; ranges are checked by validatePrescription). */
const rawEye = z.object({
  sph: z.string().max(8).optional(),
  cyl: z.string().max(8).optional(),
  axis: z.string().max(4).optional(),
  add: z.string().max(8).optional(),
}).strict();

export const prescriptionRequestSchema = z.object({
  mode: z.enum(["manual", "later"]),
  cartItemId: z.string().min(1).max(40),
  values: z.object({
    right: rawEye.optional(),
    left: rawEye.optional(),
    pd: z.string().max(6).optional(),
    readingPower: z.string().max(8).optional(),
  }).strict().optional(),
});

export const UPLOAD_LIMIT_BYTES = 5 * 1024 * 1024;
export const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;

/** Magic-number check so a renamed file can't pass as an image/PDF. */
export function sniffFileType(bytes: Uint8Array): (typeof UPLOAD_TYPES)[number] | null {
  const starts = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (starts([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (starts([0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  if (starts([0x25, 0x50, 0x44, 0x46])) return "application/pdf";
  return null;
}

export const formatPower = fmt;
