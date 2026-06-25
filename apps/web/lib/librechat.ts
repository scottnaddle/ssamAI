import { NextRequest } from "next/server";

export const LIBRECHAT_URL =
  process.env.LIBRECHAT_URL ?? "http://localhost:3090";

export type AuthOk = { token: string; user: Record<string, unknown> };
export type AuthErr = { message: string; status: number };

export async function proxyAuth(
  req: NextRequest,
  path: "login" | "register" | "logout",
): Promise<Response> {
  const url = `${LIBRECHAT_URL}/api/auth/${path}`;
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  };
  if (path === "logout") {
    const auth = req.headers.get("authorization");
    if (auth) init.headers = { ...init.headers, authorization: auth };
  } else {
    init.body = await req.text();
  }
  const upstream = await fetch(url, init);
  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}

export function extractBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export function decodeJwtSubject(token: string): { userId: string; username: string; email: string; role: string; name?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return {
      userId: payload.id ?? payload._id ?? payload.sub ?? "",
      username: payload.username ?? "",
      email: payload.email ?? "",
      role: payload.role ?? "USER",
      name: payload.name,
    };
  } catch {
    return null;
  }
}
