import { NextRequest } from "next/server";

import { refresh } from "@/lib/auth/auth";
import {
  getRefreshTokenCookieName,
  setRefreshTokenCookie,
} from "@/lib/auth/cookies";
import { jsonError, jsonSuccess } from "@/utils/http";

export async function POST(req: NextRequest) {
  const refreshToken =
    req.cookies.get(getRefreshTokenCookieName())?.value ?? null;
  if (!refreshToken) {
    return jsonError(401, "Missing refresh token", "UNAUTHORIZED");
  }

  try {
    const result = await refresh({ refreshToken });

    const res = jsonSuccess(
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      200,
      "Token refreshed",
    );
    setRefreshTokenCookie(res, result.refreshToken);

    return res;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Refresh failed";
    return jsonError(401, message, "UNAUTHORIZED");
  }
}
