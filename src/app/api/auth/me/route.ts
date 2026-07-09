import { AUTH_ERROR_MESSAGES, getCurrentUser, requireAuth } from "@/lib/auth/auth";
import { jsonError, jsonSuccess } from "@/utils/http";

export const GET = requireAuth(async (req) => {
  const user = req.user;
  if (!user) return jsonError(401, AUTH_ERROR_MESSAGES.unauthorized, "UNAUTHORIZED");

  const current = await getCurrentUser(user.id);
  if (!current) return jsonError(401, "Unauthorized", "UNAUTHORIZED");

  return jsonSuccess({ user: current }, 200, "Current user retrieved");
});
