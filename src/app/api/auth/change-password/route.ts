import {
  changePassword,
  changePasswordRequestSchema,
  requireAuth,
} from "@/lib/auth/auth";
import { clearRefreshTokenCookie } from "@/lib/auth/cookies";
import { jsonError, jsonSuccess } from "@/utils/http";

export const POST = requireAuth(async (req) => {
  const body = await req.json().catch(() => null);
  const parsed = changePasswordRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      400,
      "Invalid input",
      "VALIDATION_ERROR",
      parsed.error.flatten(),
    );
  }

  const userId = req.user?.id;
  if (!userId) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  try {
    await changePassword({
      userId,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Password change failed";
    const code =
      (error as { code?: string } | null)?.code === "INVALID_CURRENT_PASSWORD"
        ? "VALIDATION_ERROR"
        : "UNAUTHORIZED";

    return jsonError(code === "VALIDATION_ERROR" ? 400 : 401, message, code);
  }

  const res = jsonSuccess({}, 200, "Password changed successfully");
  clearRefreshTokenCookie(res);
  return res;
});
