import bcrypt from "bcryptjs";

import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { ActivityLogModel } from "@/models/activity-log";
import { UserModel } from "@/models/user";
import { adminUserSchema } from "@/validation/admin";
import { jsonSuccess } from "@/utils/http";

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

  const parsed = adminUserSchema.parse(await req.json());
  await connectToDatabase();

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
});
