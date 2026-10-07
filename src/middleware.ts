import { NextRequest, NextResponse } from "next/server";

const SID = "cp_sid";
const CSRF = "cp_csrf";
const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const rand = () => crypto.randomUUID().replace(/-/g, "");

/**
 * 1. Gives every visitor an anonymous id (guest checkout needs no account).
 * 2. CSRF protection (double-submit): unsafe /api requests must echo the cp_csrf
 *    cookie in an x-csrf-token header. Cookies are also SameSite=Lax.
 */
export function middleware(req: NextRequest) {
  const isApi = req.nextUrl.pathname.startsWith("/api/");
  if (isApi && UNSAFE.has(req.method)) {
    const cookie = req.cookies.get(CSRF)?.value;
    const header = req.headers.get("x-csrf-token");
    if (!cookie || !header || cookie !== header) {
      return NextResponse.json(
        { error: { code: "csrf_failed", message: "Your session expired. Refresh the page and try again." } },
        { status: 403 },
      );
    }
  }

  const sid = req.cookies.get(SID)?.value;
  const csrf = req.cookies.get(CSRF)?.value;
  if (sid && csrf) return NextResponse.next();

  const newSid = sid ?? rand();
  const newCsrf = csrf ?? rand();
  // Make the new cookies visible to this same request's handlers.
  const headers = new Headers(req.headers);
  const existing = req.headers.get("cookie");
  headers.set("cookie", [existing, `${SID}=${newSid}`, `${CSRF}=${newCsrf}`].filter(Boolean).join("; "));
  const res = NextResponse.next({ request: { headers } });
  const secure = process.env.NODE_ENV === "production";
  if (!sid) res.cookies.set(SID, newSid, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 90 });
  if (!csrf) res.cookies.set(CSRF, newCsrf, { httpOnly: false, sameSite: "lax", secure, path: "/" });
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|fonts|favicon.ico|icon.svg).*)"],
};
