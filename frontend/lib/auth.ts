export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const LEGACY_ACCESS_TOKEN_KEY = "access";
export const LEGACY_REFRESH_TOKEN_KEY = "refresh";

export function getStoredAuthTokens(): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null };
  }

  const accessToken =
    localStorage.getItem(ACCESS_TOKEN_KEY) ?? localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
  const refreshToken =
    localStorage.getItem(REFRESH_TOKEN_KEY) ?? localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY);

  return { accessToken, refreshToken };
}

export function setStoredAuthTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(LEGACY_ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(LEGACY_REFRESH_TOKEN_KEY, refreshToken);
}

export function clearStoredAuthTokens(): void {
  if (typeof window === "undefined") {
    return;
  }

  [
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    LEGACY_ACCESS_TOKEN_KEY,
    LEGACY_REFRESH_TOKEN_KEY,
  ].forEach((key) => localStorage.removeItem(key));
}
