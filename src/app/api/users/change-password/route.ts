import type { NextRequest } from "next/server";

import { changePasswordController } from "@/controllers/user-controller";
import { requireAuth } from "@/lib/auth/auth";
import { clearRefreshTokenCookie } from "@/lib/auth/cookies";

export const PATCH = requireAuth(async (req: NextRequest) => {
  const response = await changePasswordController(req, req.user!);
  if (response.status === 200) {
    clearRefreshTokenCookie(response);
  }
  return response;
});
