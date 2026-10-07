import { z } from "zod";
import { apiError, ok, readJson, zodError } from "@/lib/server/api";
import { prisma } from "@/lib/server/db";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { SLOTS } from "@/lib/stores";


const schema = z.object({
  storeId: z.string().min(1, "Choose a store.").max(40),
  name: z.string().trim().min(2, "Enter your name.").max(80),
  phone: z.string().trim().transform((v) => v.replace(/\D/g, "")).refine((v) => /^[6-9]\d{9}$/.test(v), "Enter a 10-digit Indian mobile number."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  slot: z.enum(SLOTS as [string, ...string[]], { message: "Choose a time." }),
});

export async function POST(req: Request) {
  const limit = rateLimit(`eye:${clientIp(req)}`, 10, 60_000);
  if (!limit.ok) return apiError(429, "rate_limited", `Too many attempts. Try again in ${limit.retryAfter} seconds.`);
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error, "Some details need fixing.");
  const d = parsed.data;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const day = new Date(`${d.date}T00:00:00`);
  if (day < today || day.getTime() - today.getTime() > 30 * 86400000) {
    return apiError(422, "validation_failed", "Choose a date in the next 30 days.", { date: "Choose a date in the next 30 days." });
  }
  const store = await prisma.storeLocation.findUnique({ where: { id: d.storeId } });
  if (!store) return apiError(404, "not_found", "That store couldn't be found.");
  if (!store.eyeTest) return apiError(422, "no_eye_test", `${store.name} doesn't offer eye tests. Choose another store.`, { storeId: "This store doesn't offer eye tests." });
  const taken = await prisma.eyeTestBooking.count({ where: { storeId: d.storeId, date: d.date, slot: d.slot } });
  if (taken >= 2) return apiError(409, "slot_full", "That time has just been booked. Choose another time.", { slot: "That time is now full." });
  const booking = await prisma.eyeTestBooking.create({ data: d });
  return ok({ booking: { id: booking.id, store: store.name, address: store.address, date: d.date, slot: d.slot } }, { status: 201 });
}
