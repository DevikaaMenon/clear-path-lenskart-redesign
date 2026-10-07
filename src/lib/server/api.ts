import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/** Consistent error shape for every API route: { error: { code, message, fields? } } */
export function apiError(status: number, code: string, message: string, fields?: Record<string, string>) {
  return NextResponse.json({ error: { code, message, ...(fields ? { fields } : {}) } }, { status });
}

export function zodError(err: ZodError, message = "Some details need fixing.") {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!fields[key]) fields[key] = issue.message;
  }
  return apiError(422, "validation_failed", message, fields);
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

export const ok = <T,>(data: T, init?: ResponseInit) => NextResponse.json(data, init);
