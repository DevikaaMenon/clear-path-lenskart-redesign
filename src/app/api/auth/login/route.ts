import bcrypt from "bcryptjs";
import { z } from "zod";
import { apiError, ok, readJson, zodError } from "@/lib/server/api";
import { prisma } from "@/lib/server/db";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { createSession, getOwner } from "@/lib/server/session";
import { mergeGuestInto } from "@/lib/server/auth-service";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter an email like name@example.com."),
  password: z.string().min(1, "Enter your password.").max(200),
});

// Constant-time-ish: always run a hash compare so timing doesn't reveal which emails exist.
const DUMMY = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8.6hJpX0b5w8i6sKzT0gFvYF5PqY8K";

export async function POST(req: Request) {
  const limit = rateLimit(`auth:${clientIp(req)}`, 10, 60_000);
  if (!limit.ok) return apiError(429, "rate_limited", `Too many attempts. Try again in ${limit.retryAfter} seconds.`);
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  const okPw = await bcrypt.compare(password, user?.passwordHash ?? DUMMY);
  if (!user || !okPw) return apiError(401, "bad_credentials", "That email and password don't match. Check them, or continue as a guest.");
  const { anonKey } = await getOwner();
  await mergeGuestInto(user.id, anonKey);
  await createSession(user.id);
  return ok({ user: { id: user.id, name: user.name, email: user.email } });
}
