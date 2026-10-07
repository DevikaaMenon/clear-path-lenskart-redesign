import { ok } from "@/lib/server/api";
import { destroySession } from "@/lib/server/session";

export async function POST() {
  await destroySession();
  return ok({ signedOut: true });
}
