import { describe, expect, it } from "vitest";
import { addressSchema, contactSchema, luhn, paymentSchema, validExpiry } from "@/lib/checkout";

describe("checkout validation", () => {
  it("accepts Indian mobile numbers in common formats", () => {
    expect(contactSchema.safeParse({ email: "a@b.co", name: "Meera", phone: "98765 43210" }).success).toBe(true);
    expect(contactSchema.safeParse({ email: "a@b.co", name: "Meera", phone: "+91 98765 43210" }).success).toBe(true);
    expect(contactSchema.safeParse({ email: "a@b.co", name: "Meera", phone: "12345" }).success).toBe(false);
  });
  it("requires a 6-digit PIN code, with a plain message", () => {
    const r = addressSchema.safeParse({ line1: "22 Example Road", city: "Bengaluru", state: "Karnataka", pincode: "5600" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toMatch(/6-digit PIN/);
  });
  it("checks cards with Luhn and a future expiry", () => {
    expect(luhn("4242424242424242")).toBe(true);
    expect(luhn("4242424242424241")).toBe(false);
    expect(validExpiry("12/99")).toBe(true);
    expect(validExpiry("01/20")).toBe(false);
    expect(paymentSchema.safeParse({ method: "card", cardNumber: "4242 4242 4242 4242", expiry: "08/30", cvc: "123" }).success).toBe(true);
  });
  it("validates UPI ids", () => {
    expect(paymentSchema.safeParse({ method: "upi", upiId: "meera@okbank" }).success).toBe(true);
    expect(paymentSchema.safeParse({ method: "upi", upiId: "meera" }).success).toBe(false);
  });
});
