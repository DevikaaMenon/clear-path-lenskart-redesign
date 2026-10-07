import { ok } from "@/lib/server/api";
import { getOwner } from "@/lib/server/session";

export async function GET() {
  const { user } = await getOwner();
  return ok({ user });
}
