import bcrypt from "bcryptjs";
import { z } from "zod";
import { apiError, ok, readJson, zodError } from "@/lib/server/api";
import { prisma } from "@/lib/server/db";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { createSession, getOwner } from "@/lib/server/session";
import { mergeGuestInto } from "@/lib/server/auth-service";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter an email like name@example.com."),
  password: z.string().min(10, "Use at least 10 characters.").max(200),
});

export async function POST(req: Request) {
  const limit = rateLimit(`auth:${clientIp(req)}`, 10, 60_000);
  if (!limit.ok) return apiError(429, "rate_limited", `Too many attempts. Try again in ${limit.retryAfter} seconds.`);
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { name, email, password } = parsed.data;
  if (await prisma.user.findUnique({ where: { email } })) {
    return apiError(409, "email_taken", "An account with this email already exists. Sign in instead.", { email: "An account with this email already exists." });
  }
  const user = await prisma.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 12) } });
  const { anonKey } = await getOwner();
  await mergeGuestInto(user.id, anonKey);
  await createSession(user.id);
  return ok({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
}
