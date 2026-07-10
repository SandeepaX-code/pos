import bcrypt from "bcryptjs";

import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { ActivityLogModel } from "@/models/activity-log";
import { UserModel } from "@/models/user";
import { adminUserSchema } from "@/validation/admin";
import { jsonError, jsonSuccess } from "@/utils/http";

export const GET = requireAuth(async (req) => {
  const denied = await requirePermission("users.view")(req);
  if (denied) return denied;

  await connectToDatabase();
  const users = await UserModel.find().sort({ createdAt: -1 }).lean().exec();
  return jsonSuccess(users, 200, "Users retrieved");
});

export const POST = requireAuth(async (req) => {
  const denied = await requirePermission("users.create")(req);
  if (denied) return denied;

  try {
    const body = await req.json().catch(() => null);
    const parsedResult = adminUserSchema.safeParse(body);

    if (!parsedResult.success) {
      return jsonError(400, "Invalid input parameters", "VALIDATION_ERROR", {
        errors: parsedResult.error.flatten(),
      });
    }

    const parsed = parsedResult.data;
    await connectToDatabase();

    // Check for duplicate username or email first
    const existing = await UserModel.findOne({
      $or: [{ username: parsed.username }, { email: parsed.email }],
    }).lean().exec();

    if (existing) {
      if (existing.username === parsed.username) {
        return jsonError(409, "Username already exists", "CONFLICT");
      }
      return jsonError(409, "Email already exists", "CONFLICT");
    }

    const user = await UserModel.create({
      ...parsed,
      passwordHash: await bcrypt.hash(parsed.password, 12),
    });

    await ActivityLogModel.create({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: "user.created",
      entity: "User",
      entityId: user._id,
      branchId: req.user!.branchId,
      metadata: { username: user.username, role: user.role },
    });

    return jsonSuccess(user, 201, "User created");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create user";
    return jsonError(500, message, "INTERNAL_ERROR");
  }
});
