"use client";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
  get isNetwork() {
    return this.status === 0;
  }
}

function csrfToken(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)cp_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

/** Test hook: ?fail=network|server makes the next order/payment call fail, to test recovery UI. */
function injectedFailure(path: string): ApiError | null {
  if (typeof window === "undefined") return null;
  const f = new URLSearchParams(window.location.search).get("fail");
  if (!f || !path.startsWith("/api/orders")) return null;
  if (f === "network") return new ApiError(0, "network", "We couldn't reach the server. Check your connection and try again.");
  return null;
}

/**
 * JSON fetch with CSRF header, consistent errors and one automatic retry
 * on network failure for idempotent requests.
 */
export async function api<T>(
  path: string,
  opts: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; signal?: AbortSignal; retry?: boolean } = {},
): Promise<T> {
  const method = opts.method ?? "GET";
  const injected = injectedFailure(path);
  if (injected) throw injected;
  const attempt = async () => {
    const res = await fetch(path, {
      method,
      signal: opts.signal,
      headers: {
        Accept: "application/json",
        ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(method !== "GET" ? { "x-csrf-token": csrfToken() } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const e = data?.error;
      throw new ApiError(res.status, e?.code ?? "error", e?.message ?? "Something went wrong. Please try again.", e?.fields);
    }
    return data as T;
  };
  try {
    return await attempt();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error)?.name === "AbortError") throw err;
    if (opts.retry ?? method === "GET") {
      try {
        return await attempt();
      } catch (err2) {
        if (err2 instanceof ApiError) throw err2;
      }
    }
    throw new ApiError(0, "network", "We couldn't reach the server. Check your connection and try again.");
  }
}

/** Multipart upload with CSRF header. */
export async function upload<T>(path: string, form: FormData): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { method: "POST", body: form, headers: { "x-csrf-token": csrfToken() }, credentials: "same-origin" });
  } catch {
    throw new ApiError(0, "network", "The upload didn't reach us. Check your connection and try again.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = data?.error;
    throw new ApiError(res.status, e?.code ?? "error", e?.message ?? "Upload failed. Please try again.", e?.fields);
  }
  return data as T;
}
