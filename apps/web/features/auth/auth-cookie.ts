import { AUTH_COOKIE_NAME, type AuthUser } from "@/stores/auth-store";

export { AUTH_COOKIE_NAME };

export function parseAuthCookie(value: string | undefined): AuthUser | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<AuthUser>;
    if (typeof parsed.email !== "string" || typeof parsed.name !== "string") {
      return null;
    }
    return { email: parsed.email, name: parsed.name };
  } catch {
    return null;
  }
}
