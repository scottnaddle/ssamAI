/**
 * Client-side auth token store.
 *
 * Phase 1 keeps the JWT in localStorage. Phase 2 will move this to an
 * httpOnly cookie set via a server action to mitigate XSS token theft.
 */

const TOKEN_KEY = "ssamAI:token";
const USER_KEY = "ssamAI:user";

export interface AuthUser {
  id: string;
  name: string;
  username?: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuth(token: string, user: AuthUser): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}
