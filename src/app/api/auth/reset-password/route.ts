import { NextRequest } from "next/server";

import { ensureDb } from "@/lib/db";
import { resetPasswordSchema } from "@/validators/auth";
import { jsonError, jsonSuccess } from "@/utils/http";
import { UserModel } from "@/models/user";

export async function POST(req: NextRequest) {
  await ensureDb();

  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      400,
      "Invalid input",
      "VALIDATION_ERROR",
      parsed.error.flatten(),
    );
  }

  const { token, newPassword } = parsed.data;

  const user = await UserModel.findOne({
    passwordResetToken: token,
    passwordResetExpiresAt: { $gt: new Date() },
    active: true,
  });

  if (!user) {
    return jsonError(400, "Invalid or expired reset token", "VALIDATION_ERROR");
  }

  user.passwordHash = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpiresAt = undefined;

  await user.save();

  return jsonSuccess({}, 200, "Password reset successfully");
}
