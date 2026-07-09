import type { NextResponse } from "next/server";

import { AUTH } from "@/constants/auth";

export function getRefreshTokenCookieName() {
  return AUTH.refreshCookieName;
}

export function getRefreshTokenCookieOptions() {
  return AUTH.refreshCookieOptions;
}

export function setRefreshTokenCookie(
  response: NextResponse,
  refreshToken: string,
) {
  response.cookies.set(AUTH.refreshCookieName, refreshToken, {
    ...AUTH.refreshCookieOptions,
    maxAge: AUTH.refreshTokenTtlSeconds,
  });
}

export function clearRefreshTokenCookie(response: NextResponse) {
  response.cookies.set(AUTH.refreshCookieName, "", {
    ...AUTH.refreshCookieOptions,
    maxAge: 0,
  });
}
