import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./db";

export const SID_COOKIE = "cp_sid";
export const SESSION_COOKIE = "cp_session";
export const SESSION_DAYS = 14;

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");

export interface Owner {
  ownerKey: string; // "u:<id>" when signed in, else "a:<anonymous id>"
  anonKey: string | null;
  user: { id: string; email: string; name: string } | null;
}

/** Resolve who is making this request. Middleware guarantees the anonymous id cookie. */
export async function getOwner(): Promise<Owner> {
  const jar = await cookies();
  const sid = jar.get(SID_COOKIE)?.value ?? null;
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    if (session && session.expiresAt > new Date()) {
      return { ownerKey: `u:${session.user.id}`, anonKey: sid ? `a:${sid}` : null, user: session.user };
    }
  }
  return { ownerKey: `a:${sid ?? "missing"}`, anonKey: sid ? `a:${sid}` : null, user: null };
}

export async function createSession(userId: string) {
  const token = newToken();
  await prisma.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt: new Date(Date.now() + SESSION_DAYS * 86400000) },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_DAYS * 86400,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}
