/**
 * Checkout validation shared by the checkout form (inline) and POST /api/orders (authoritative).
 * Payments are SIMULATED. Card details are never stored or logged; only the method is kept.
 */
import { z } from "zod";

export const COD_LIMIT = 10000;

/** Demo triggers so the error-recovery UI can be tested (documented in the README). */
export const DEMO_DECLINE_CARD = "4000000000000002";
export const DEMO_DECLINE_UPI = "fail@demo";

const digits = (s: string) => s.replace(/\D/g, "");

export const contactSchema = z.object({
  email: z.string().trim().min(1, "Enter your email so we can send your order details.").email("Enter an email like name@example.com."),
  name: z.string().trim().min(2, "Enter your full name as it should appear on the parcel.").max(80, "Name is too long."),
  phone: z
    .string()
    .trim()
    .transform(digits)
    .refine((v) => /^[6-9]\d{9}$/.test(v.length === 12 && v.startsWith("91") ? v.slice(2) : v), "Enter a 10-digit Indian mobile number, like 98765 43210."),
});

export const addressSchema = z.object({
  line1: z.string().trim().min(3, "Enter your house or flat number and street.").max(120),
  line2: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().min(2, "Enter your town or city.").max(60),
  state: z.string().trim().min(2, "Choose your state.").max(60),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a 6-digit PIN code, like 560011."),
});

export const paymentSchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("upi"), upiId: z.string().trim().regex(/^[\w.-]{2,}@[a-zA-Z]{2,}$/, "Enter a UPI ID like name@bank.") }),
  z.object({
    method: z.literal("card"),
    cardNumber: z.string().transform(digits).refine((v) => v.length >= 13 && v.length <= 19 && luhn(v), "Check the card number. It should be 16 digits."),
    expiry: z.string().trim().refine(validExpiry, "Enter a future expiry date as MM/YY."),
    cvc: z.string().trim().regex(/^\d{3,4}$/, "The security code is the 3 digits on the back."),
  }),
  z.object({ method: z.literal("netbanking"), bank: z.string().min(2, "Choose your bank.") }),
  z.object({ method: z.literal("cod") }),
]);

export const orderSchema = z.object({
  idempotencyKey: z.string().uuid(),
  contact: contactSchema,
  address: addressSchema,
  payment: paymentSchema,
  shownTotal: z.number().int().nonnegative(),
});
export type OrderInput = z.input<typeof orderSchema>;

export function luhn(num: string): boolean {
  let sum = 0;
  let dbl = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = +num[i];
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

export function validExpiry(v: string, now = new Date()): boolean {
  const m = v.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) return false;
  const month = +m[1], year = 2000 + +m[2];
  if (month < 1 || month > 12) return false;
  const end = new Date(year, month, 1); // first day after expiry month
  return end > now;
}

/** Delivery window: 4–7 days from now, skipping nothing (demo). */
export function deliveryWindow(from = new Date()) {
  const d = (n: number) => new Date(from.getTime() + n * 86400000);
  return { from: d(4), to: d(7) };
}

export const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Other",
];
