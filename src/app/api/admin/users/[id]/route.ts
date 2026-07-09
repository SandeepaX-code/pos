import bcrypt from "bcryptjs";

import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { ActivityLogModel } from "@/models/activity-log";
import { UserModel } from "@/models/user";
import { adminUserUpdateSchema } from "@/validation/admin";
import { jsonError, jsonSuccess } from "@/utils/http";

export const PATCH = requireAuth(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("users.update")(req);
    if (denied) return denied;

    const { id } = await params;
    const parsed = adminUserUpdateSchema.parse(await req.json());
    const payload = { ...parsed } as Record<string, unknown>;

    await connectToDatabase();
    const existing = await UserModel.findById(id).lean().exec();
    if (!existing) {
      return jsonError(404, "User not found", "NOT_FOUND");
    }

    if (parsed.password) {
      payload.passwordHash = await bcrypt.hash(parsed.password, 12);
      delete payload.password;
    }

    const user = await UserModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    })
      .lean()
      .exec();

    if (!user) {
      return jsonError(404, "User not found", "NOT_FOUND");
    }

    if (parsed.role && parsed.role !== existing.role) {
      await ActivityLogModel.create({
        userId: req.user!.id,
        userName: req.user!.fullName,
        action: "role.changed",
        entity: "User",
        entityId: id,
        branchId: req.user!.branchId,
        metadata: {
          username: user.username,
          previousRole: existing.role,
          nextRole: user.role,
        },
      });
    }

    await ActivityLogModel.create({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: "user.updated",
      entity: "User",
      entityId: id,
      branchId: req.user!.branchId,
      metadata: { username: user.username, role: user.role },
    });

    return jsonSuccess(user, 200, "User updated");
  },
);

export const DELETE = requireAuth(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("users.delete")(req);
    if (denied) return denied;

    const { id } = await params;
    await connectToDatabase();
    const deleted = await UserModel.findByIdAndDelete(id).lean().exec();

    if (!deleted) {
      return jsonError(404, "User not found", "NOT_FOUND");
    }

    await ActivityLogModel.create({
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: "user.deleted",
      entity: "User",
      entityId: id,
      branchId: req.user!.branchId,
      metadata: { username: deleted.username, role: deleted.role },
    });

    return jsonSuccess(deleted, 200, "User deleted");
  },
);
