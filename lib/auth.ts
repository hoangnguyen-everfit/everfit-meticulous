export const AUTH_TOKEN_KEY = "demo_auth_token";

export function login(email: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, `token-for-${email}`);
}

export function logout(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
