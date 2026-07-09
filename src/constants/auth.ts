export const AUTH = {
  accessTokenTtlSeconds: 15 * 60, // 15 minutes
  refreshTokenTtlSeconds: 7 * 24 * 60 * 60, // 7 days

  refreshCookieName: "refresh_token",
  // HTTP-only cookie for refresh token; access token is returned in body and can also be used by frontend.
  refreshCookieOptions: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },

  // Rotation safety: require refresh token rotation for every refresh.
  // Access tokens are short-lived and validated statelessly.
} as const;
