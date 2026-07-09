import { NextRequest } from "next/server";

import { login, loginRequestSchema } from "@/lib/auth/auth";
import { setRefreshTokenCookie } from "@/lib/auth/cookies";
import { jsonError, jsonSuccess } from "@/utils/http";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      400,
      "Invalid input",
      "VALIDATION_ERROR",
      parsed.error.flatten(),
    );
  }

  try {
    const result = await login({
      username: parsed.data.username,
      password: parsed.data.password,
    });

    const res = jsonSuccess(
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      200,
      "Login successful",
    );
    setRefreshTokenCookie(res, result.refreshToken);

    return res;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Login failed";
    const code =
      (e as { code?: string } | null)?.code === "INVALID_CREDENTIALS"
        ? "UNAUTHORIZED"
        : "INTERNAL_ERROR";
    return jsonError(
      code === "UNAUTHORIZED" ? 401 : 500,
      message,
      code as "UNAUTHORIZED" | "INTERNAL_ERROR",
    );
  }
}
