import { NextRequest } from "next/server";

import { logout } from "@/lib/auth/auth";
import {
  clearRefreshTokenCookie,
  getRefreshTokenCookieName,
} from "@/lib/auth/cookies";
import { jsonSuccess } from "@/utils/http";

export async function POST(req: NextRequest) {
  const refreshToken =
    req.cookies.get(getRefreshTokenCookieName())?.value ?? null;

  try {
    await logout({ refreshToken });

    const res = jsonSuccess({}, 200, "Logged out successfully");
    clearRefreshTokenCookie(res);

    return res;
  } catch {
    const res = jsonSuccess({}, 200, "Logged out successfully");
    clearRefreshTokenCookie(res);
    return res;
  }
}
