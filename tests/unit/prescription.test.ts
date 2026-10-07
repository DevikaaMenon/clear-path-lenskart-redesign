import { describe, expect, it } from "vitest";
import { parsePower, sniffFileType, validatePrescription } from "@/lib/prescription";

const ok = { right: { sph: "-1.25", cyl: "-0.50", axis: "90" }, left: { sph: "-1.00" }, pd: "62" };

describe("parsePower", () => {
  it("accepts signs, commas and blanks", () => {
    expect(parsePower("+1.25")).toBe(1.25);
    expect(parsePower("-0,75")).toBe(-0.75);
    expect(parsePower("")).toBeNull();
    expect(Number.isNaN(parsePower("abc"))).toBe(true);
  });
});

describe("validatePrescription", () => {
  it("accepts a normal prescription", () => {
    const r = validatePrescription(ok, { purpose: "prescription" });
    expect(r.ok).toBe(true);
    expect(r.values?.right?.axis).toBe(90);
    expect(r.values?.left?.cyl).toBe(0);
  });
  it("requires sphere for both eyes", () => {
    const r = validatePrescription({ right: {}, left: {}, pd: "62" }, { purpose: "prescription" });
    expect(r.issues.map((i) => i.field)).toEqual(expect.arrayContaining(["right.sph", "left.sph"]));
    expect(r.issues[0].message).toMatch(/enter 0/i);
  });
  it("rejects values that are not quarter steps, with a suggestion", () => {
    const r = validatePrescription({ ...ok, right: { sph: "-1.30" } }, { purpose: "prescription" });
    expect(r.issues[0].message).toMatch(/steps of 0.25.*-1.25/);
  });
  it("rejects out-of-range values in plain language", () => {
    const r = validatePrescription({ ...ok, left: { sph: "-25" } }, { purpose: "prescription" });
    expect(r.issues[0].message).toMatch(/between -20.00 and \+20.00/);
  });
  it("requires axis when cylinder is set, and checks its range", () => {
    expect(validatePrescription({ ...ok, right: { sph: "-1", cyl: "-1" } }, { purpose: "prescription" }).issues[0].field).toBe("right.axis");
    expect(validatePrescription({ ...ok, right: { sph: "-1", cyl: "-1", axis: "200" } }, { purpose: "prescription" }).issues[0].message).toMatch(/1 to 180/);
  });
  it("warns (not errors) when axis is given without cylinder", () => {
    const r = validatePrescription({ ...ok, left: { sph: "-1", axis: "90" } }, { purpose: "prescription" });
    expect(r.ok).toBe(true);
    expect(r.warnings[0].field).toBe("left.axis");
  });
  it("sanity-checks high powers and very different eyes", () => {
    const r = validatePrescription({ right: { sph: "-11" }, left: { sph: "-2" }, pd: "62" }, { purpose: "prescription" });
    expect(r.ok).toBe(true);
    expect(r.warnings.map((w) => w.field)).toEqual(expect.arrayContaining(["right.sph", "left.sph"]));
  });
  it("validates PD range and format", () => {
    expect(validatePrescription({ ...ok, pd: "" }, { purpose: "prescription" }).issues[0].field).toBe("pd");
    expect(validatePrescription({ ...ok, pd: "90" }, { purpose: "prescription" }).issues[0].message).toMatch(/between 50 and 80/);
    expect(validatePrescription({ ...ok, pd: "62.5" }, { purpose: "prescription" }).ok).toBe(true);
  });
  it("needs ADD for progressive lenses", () => {
    const r = validatePrescription(ok, { purpose: "prescription", needsAdd: true });
    expect(r.issues.map((i) => i.field)).toEqual(["right.add", "left.add"]);
  });
  it("asks only for a reading power for reading glasses", () => {
    expect(validatePrescription({ readingPower: "+1.50" }, { purpose: "reading" }).values).toEqual({ kind: "reading", readingPower: 1.5 });
    expect(validatePrescription({ readingPower: "4" }, { purpose: "reading" }).ok).toBe(false);
  });
});

describe("sniffFileType", () => {
  it("detects real file types by magic number, not by extension", () => {
    expect(sniffFileType(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]))).toBe("application/pdf");
    expect(sniffFileType(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe("image/png");
    expect(sniffFileType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffFileType(new TextEncoder().encode("<script>"))).toBeNull();
  });
});
