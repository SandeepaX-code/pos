import { NextRequest } from "next/server";

import { ensureDb } from "@/lib/db";
import { forgotPasswordSchema } from "@/validators/auth";
import { jsonError, jsonSuccess } from "@/utils/http";
import { UserModel } from "@/models/user";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  await ensureDb();

  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      400,
      "Invalid input",
      "VALIDATION_ERROR",
      parsed.error.flatten(),
    );
  }

  // Always respond with success to prevent account enumeration.
  const email = parsed.data.email;

  const user = await UserModel.findOne({ email }).select("_id active");
  if (user && user.active) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    await UserModel.updateOne(
      { _id: user._id },
      {
        $set: { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
      },
    );

    // NOTE: Production integration should send email.
    // This system returns token for development; frontend should handle with its existing flow.
  }

  return jsonSuccess(
    {},
    200,
    "If the email exists, a reset link has been sent",
  );
}
