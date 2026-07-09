import { Types } from "mongoose";

import {
  comparePassword,
  generateTemporaryPassword,
  hashPassword,
  isPasswordReused,
} from "@/lib/auth/password";
import { rolePermissions } from "@/lib/permissions";
import { connectToDatabase } from "@/lib/mongoose";
import { BranchModel } from "@/models/branch";
import { RefreshTokenModel } from "@/models/refresh-token";
import { RoleModel } from "@/models/role";

import { ActivityLogService } from "./activity-log-service";
import { RoleRepository } from "@/repositories/role-repository";
import { UserRepository } from "@/repositories/user-repository";

type UserActor = {
  id: string;
  role: string;
  permissions: string[];
  branchId?: string;
  fullName?: string;
};

type LeanUserRecord = {
  _id: unknown;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  roleId?: { _id?: unknown; name?: string; label?: string } | unknown;
  branchId?: { _id?: unknown; name?: string; code?: string } | unknown;
  active: boolean;
  avatar?: string | null;
  lastLoginAt?: Date | string | null;
  mustChangePassword?: boolean;
  deletedAt?: Date | string | null;
  deletedBy?: unknown;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type UserListResponseItem = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  roleId?: string;
  branchId: string;
  active: boolean;
  avatar?: string;
  lastLoginAt?: string;
  mustChangePassword?: boolean;
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

function toIso(value: Date | string | null | undefined) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function toObjectIdString(value: unknown) {
  if (!value) return undefined;
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id?: unknown })._id ?? value);
  }
  return String(value);
}

function serializeUser(user: LeanUserRecord): UserListResponseItem {
  return {
    id: String(user._id),
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role,
    roleId: toObjectIdString(user.roleId),
    branchId: toObjectIdString(user.branchId) ?? "",
    active: Boolean(user.active),
    avatar: user.avatar ?? undefined,
    lastLoginAt: toIso(user.lastLoginAt),
    mustChangePassword: Boolean(user.mustChangePassword),
    deletedAt: toIso(user.deletedAt),
    createdAt: toIso(user.createdAt),
    updatedAt: toIso(user.updatedAt),
  };
}

function assertUserManagementAccess(actor: UserActor) {
  if (!["superAdmin", "admin"].includes(actor.role)) {
    throw Object.assign(new Error("Forbidden"), { code: "FORBIDDEN" as const });
  }
}

function assertRoleEscalationAllowed(actor: UserActor, targetRole: string) {
  if (targetRole === "superAdmin" && actor.role !== "superAdmin") {
    throw Object.assign(new Error("Unauthorized role escalation"), {
      code: "USER_ROLE_ESCALATION" as const,
    });
  }
}

async function resolveRolePermissions(roleName: string, roleId?: unknown) {
  const roleDoc = roleId
    ? await RoleModel.findById(toObjectIdString(roleId))
        .populate("permissions")
        .lean<{ permissions?: Array<{ key?: string; label?: string }> }>()
        .exec()
    : await RoleModel.findOne({ name: roleName, active: true })
        .populate("permissions")
        .lean<{ permissions?: Array<{ key?: string; label?: string }> }>()
        .exec();

  if (roleDoc?.permissions?.length) {
    return roleDoc.permissions
      .map((permission) => ({
        key: permission.key,
        label: permission.label,
      }))
      .filter((permission) => typeof permission.key === "string");
  }

  const staticPermissions =
    rolePermissions[roleName as keyof typeof rolePermissions] ?? [];

  return staticPermissions.map((key) => ({ key, label: key }));
}

export class UserService {
  private readonly users = new UserRepository();
  private readonly roles = new RoleRepository();
  private readonly activity = new ActivityLogService();

  async listUsers(input: {
    search?: string;
    roleId?: string;
    role?: string;
    branchId?: string;
    active?: boolean;
    status?: "active" | "inactive";
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page: number;
    limit: number;
  }) {
    await connectToDatabase();

    const active =
      input.status === "active"
        ? true
        : input.status === "inactive"
          ? false
          : input.active;

    const { items, total } = await this.users.list(
      {
        search: input.search,
        roleId: input.roleId,
        role: input.role,
        branchId: input.branchId,
        active,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
      },
      { page: input.page, limit: input.limit },
    );

    return {
      items: items.map((user) => serializeUser(user as LeanUserRecord)),
      total,
      page: input.page,
      limit: input.limit,
      totalPages: Math.max(1, Math.ceil(total / input.limit)),
    };
  }

  async getUser(id: string) {
    await connectToDatabase();
    const user = await this.users.findLeanById(id, true);
    if (!user) {
      throw Object.assign(new Error("User not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    return serializeUser(user as LeanUserRecord);
  }

  async getUserDetails(id: string) {
    await connectToDatabase();
    const user = (await this.users.findLeanById(id, true)) as LeanUserRecord | null;
    if (!user) {
      throw Object.assign(new Error("User not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    const branchId = toObjectIdString(user.branchId);
    const branch = branchId
      ? await BranchModel.findById(branchId).lean().exec()
      : null;

    const roleId = toObjectIdString(user.roleId);
    const role = roleId
      ? await RoleModel.findById(roleId).lean().exec()
      : await RoleModel.findOne({ name: user.role }).lean().exec();

    const permissions = await resolveRolePermissions(user.role, user.roleId);
    const activityLogs = await this.activity.listByEntity("User", id, {
      page: 1,
      limit: 50,
    });

    return {
      ...serializeUser(user),
      roleDetails: role
        ? {
            id: String(role._id),
            name: role.name,
            label: role.label,
            description: role.description ?? undefined,
            active: role.active,
          }
        : {
            name: user.role,
            label: user.role,
          },
      permissions,
      branch: branch
        ? {
            id: String(branch._id),
            name: branch.name,
            code: branch.code,
            city: branch.city,
          }
        : branchId
          ? { id: branchId }
          : undefined,
      activityLogs: activityLogs.items,
      lastLoginAt: toIso(user.lastLoginAt),
      createdAt: toIso(user.createdAt),
    };
  }

  async createUser(
    input: {
      fullName: string;
      username: string;
      email: string;
      phone: string;
      password: string;
      roleId: string;
      branchId: string;
      active: boolean;
      avatar?: string;
    },
    actor: UserActor,
  ) {
    await connectToDatabase();
    assertUserManagementAccess(actor);

    const role = await RoleModel.findById(input.roleId).lean().exec();
    if (!role || !role.active) {
      throw Object.assign(new Error("Role not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    assertRoleEscalationAllowed(actor, role.name);

    const existingUsername = await this.users.findByUsername(input.username);
    if (existingUsername) {
      throw Object.assign(new Error("Username already exists"), {
        code: "CONFLICT" as const,
      });
    }

    const existingEmail = await this.users.findByEmail(input.email);
    if (existingEmail) {
      throw Object.assign(new Error("Email already exists"), {
        code: "CONFLICT" as const,
      });
    }

    const user = await this.users.create({
      fullName: input.fullName,
      username: input.username,
      email: input.email,
      phone: input.phone,
      passwordHash: input.password,
      role: role.name,
      roleId: new Types.ObjectId(role._id),
      branchId: new Types.ObjectId(input.branchId),
      active: input.active,
      avatar: input.avatar,
      mustChangePassword: false,
    });

    await this.activity.log({
      action: "user.created",
      entity: "User",
      entityId: String(user._id),
      actor: {
        id: actor.id,
        name: actor.fullName ?? actor.id,
        branchId: actor.branchId ?? input.branchId,
      },
      metadata: { username: user.username, role: user.role },
    });

    return serializeUser(
      (await this.users.findLeanById(String(user._id))) as LeanUserRecord,
    );
  }

  async updateUser(
    id: string,
    input: {
      fullName?: string;
      username?: string;
      email?: string;
      phone?: string;
      roleId?: string;
      branchId?: string;
      active?: boolean;
      avatar?: string;
    },
    actor: UserActor,
  ) {
    await connectToDatabase();
    assertUserManagementAccess(actor);

    const existing = await this.users.findById(id);
    if (!existing) {
      throw Object.assign(new Error("User not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    if (input.username && input.username !== existing.username) {
      if (actor.role !== "superAdmin") {
        throw Object.assign(
          new Error("Only Super Admin can change usernames"),
          { code: "FORBIDDEN" as const },
        );
      }

      const duplicate = await this.users.findByUsername(input.username);
      if (duplicate && String(duplicate._id) !== id) {
        throw Object.assign(new Error("Username already exists"), {
          code: "CONFLICT" as const,
        });
      }
    }

    const nextRoleId = input.roleId
      ? new Types.ObjectId(input.roleId)
      : existing.roleId;
    const nextRole = input.roleId
      ? await RoleModel.findById(input.roleId).lean().exec()
      : await RoleModel.findById(String(existing.roleId ?? ""))
          .lean()
          .exec();

    if (!nextRole) {
      throw Object.assign(new Error("Role not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    assertRoleEscalationAllowed(actor, nextRole.name);

    if (actor.role !== "superAdmin" && String(existing.role) === "superAdmin") {
      throw Object.assign(new Error("Forbidden"), {
        code: "FORBIDDEN" as const,
      });
    }

    if (actor.id === id && input.roleId && String(existing.roleId ?? "") !== input.roleId) {
      throw Object.assign(new Error("You cannot change your own role"), {
        code: "SELF_ROLE_ESCALATION" as const,
      });
    }

    if (input.email && input.email !== existing.email) {
      const duplicate = await this.users.findByEmail(input.email);
      if (duplicate && String(duplicate._id) !== id) {
        throw Object.assign(new Error("Email already exists"), {
          code: "CONFLICT" as const,
        });
      }
    }

    const payload: Record<string, unknown> = {
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.username !== undefined ? { username: input.username } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.branchId !== undefined
        ? { branchId: new Types.ObjectId(input.branchId) }
        : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
      ...(nextRoleId ? { roleId: nextRoleId, role: nextRole.name } : {}),
    };

    const updated = await this.users.updateById(id, payload);
    if (!updated) {
      throw Object.assign(new Error("User not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    if (input.roleId && String(existing.roleId ?? "") !== input.roleId) {
      await this.activity.log({
        action: "role.changed",
        entity: "User",
        entityId: id,
        actor: {
          id: actor.id,
          name: actor.fullName ?? actor.id,
          branchId: actor.branchId ?? String(updated.branchId),
        },
        metadata: {
          username: updated.username,
          previousRole: existing.role,
          nextRole: updated.role,
        },
      });
    }

    await this.activity.log({
      action: "user.updated",
      entity: "User",
      entityId: id,
      actor: {
        id: actor.id,
        name: actor.fullName ?? actor.id,
        branchId: actor.branchId ?? String(updated.branchId),
      },
      metadata: { username: updated.username, role: updated.role },
    });

    return serializeUser((await this.users.findLeanById(id)) as LeanUserRecord);
  }

  async deleteUser(id: string, actor: UserActor) {
    await connectToDatabase();
    assertUserManagementAccess(actor);

    const existing = await this.users.findById(id);
    if (!existing) {
      throw Object.assign(new Error("User not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    if (actor.id === id && existing.role === "superAdmin") {
      throw Object.assign(
        new Error("Cannot delete your own super admin account"),
        {
          code: "SELF_DELETE_FORBIDDEN" as const,
        },
      );
    }

    if (actor.role !== "superAdmin" && existing.role === "superAdmin") {
      throw Object.assign(new Error("Forbidden"), {
        code: "FORBIDDEN" as const,
      });
    }

    const deleted = await this.users.softDeleteById(id, actor.id);
    if (!deleted) {
      throw Object.assign(new Error("User not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    await RefreshTokenModel.updateMany(
      { userId: new Types.ObjectId(id), revoked: false },
      { $set: { revoked: true } },
    );

    await this.activity.log({
      action: "user.deleted",
      entity: "User",
      entityId: id,
      actor: {
        id: actor.id,
        name: actor.fullName ?? actor.id,
        branchId: actor.branchId ?? String(deleted.branchId),
      },
      metadata: { username: deleted.username, role: deleted.role },
    });

    return serializeUser((await this.users.findLeanById(id, true)) as LeanUserRecord);
  }

  async setUserStatus(id: string, active: boolean, actor: UserActor) {
    await connectToDatabase();
    assertUserManagementAccess(actor);

    const existing = await this.users.findById(id);
    if (!existing) {
      throw Object.assign(new Error("User not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    if (actor.role !== "superAdmin" && existing.role === "superAdmin") {
      throw Object.assign(new Error("Forbidden"), {
        code: "FORBIDDEN" as const,
      });
    }

    const updated = await this.users.setActiveStatus(id, active);
    if (!updated) {
      throw Object.assign(new Error("User not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    if (!active) {
      await RefreshTokenModel.updateMany(
        { userId: new Types.ObjectId(id), revoked: false },
        { $set: { revoked: true } },
      );
    }

    await this.activity.log({
      action: active ? "account.enabled" : "account.disabled",
      entity: "User",
      entityId: id,
      actor: {
        id: actor.id,
        name: actor.fullName ?? actor.id,
        branchId: actor.branchId ?? String(updated.branchId),
      },
      metadata: { username: updated.username, active },
    });

    return serializeUser((await this.users.findLeanById(id)) as LeanUserRecord);
  }

  async resetPassword(
    id: string,
    newPassword: string | undefined,
    actor: UserActor,
  ) {
    await connectToDatabase();
    assertUserManagementAccess(actor);

    const existing = await this.users.findById(id);
    if (!existing) {
      throw Object.assign(new Error("User not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    if (actor.role !== "superAdmin" && existing.role === "superAdmin") {
      throw Object.assign(new Error("Forbidden"), {
        code: "FORBIDDEN" as const,
      });
    }

    const temporaryPassword = newPassword ?? generateTemporaryPassword();
    const user = await this.users.resetPassword(id, temporaryPassword, true);
    if (!user) {
      throw Object.assign(new Error("User not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    await RefreshTokenModel.updateMany(
      { userId: new Types.ObjectId(id), revoked: false },
      { $set: { revoked: true } },
    );

    await this.activity.log({
      action: "password.reset",
      entity: "User",
      entityId: id,
      actor: {
        id: actor.id,
        name: actor.fullName ?? actor.id,
        branchId: actor.branchId ?? String(user.branchId),
      },
      metadata: { username: user.username, role: user.role, generated: !newPassword },
    });

    return {
      user: serializeUser((await this.users.findLeanById(id)) as LeanUserRecord),
      temporaryPassword,
    };
  }

  async changePassword(
    userId: string,
    input: {
      currentPassword: string;
      newPassword: string;
    },
  ) {
    await connectToDatabase();

    const userDoc = await this.users.findByIdWithSecrets(userId);

    if (!userDoc || !userDoc.active || userDoc.deletedAt) {
      throw Object.assign(new Error("Unauthorized"), {
        code: "UNAUTHORIZED" as const,
      });
    }

    const matches = await comparePassword(
      input.currentPassword,
      userDoc.passwordHash,
    );

    if (!matches) {
      throw Object.assign(new Error("Current password is incorrect"), {
        code: "INVALID_CURRENT_PASSWORD" as const,
      });
    }

    const previousPasswordHash =
      userDoc.previousPasswordHash ?? userDoc.passwordHash;

    if (await isPasswordReused(input.newPassword, previousPasswordHash)) {
      throw Object.assign(new Error("Cannot reuse your previous password"), {
        code: "PASSWORD_REUSED" as const,
      });
    }

    const nextHash = await hashPassword(input.newPassword);
    const updated = await this.users.changePassword(
      userId,
      nextHash,
      userDoc.passwordHash,
    );

    if (!updated) {
      throw Object.assign(new Error("User not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    await RefreshTokenModel.updateMany(
      { userId: new Types.ObjectId(userId), revoked: false },
      { $set: { revoked: true } },
    );

    await this.activity.log({
      action: "password.changed",
      entity: "User",
      entityId: userId,
      actor: {
        id: userId,
        name: updated.fullName,
        branchId: String(updated.branchId),
      },
      metadata: { username: updated.username },
    });

    return serializeUser(
      (await this.users.findLeanById(userId)) as LeanUserRecord,
    );
  }

  async getProfile(userId: string) {
    await connectToDatabase();
    const user = await this.users.findLeanById(userId);
    if (!user) {
      throw Object.assign(new Error("User not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    const permissions = await resolveRolePermissions(
      (user as LeanUserRecord).role,
      (user as LeanUserRecord).roleId,
    );

    return {
      ...serializeUser(user as LeanUserRecord),
      permissions: permissions.map((permission) => permission.key),
    };
  }

  async updateProfile(
    userId: string,
    input: {
      email?: string;
      phone?: string;
      avatar?: string;
    },
  ) {
    await connectToDatabase();

    const existing = await this.users.findById(userId);
    if (!existing) {
      throw Object.assign(new Error("User not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    if (input.email && input.email !== existing.email) {
      const duplicate = await this.users.findByEmail(input.email);
      if (duplicate && String(duplicate._id) !== userId) {
        throw Object.assign(new Error("Email already exists"), {
          code: "CONFLICT" as const,
        });
      }
    }

    const payload: Record<string, unknown> = {
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
    };

    const updated = await this.users.updateById(userId, payload);
    if (!updated) {
      throw Object.assign(new Error("User not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    await this.activity.log({
      action: "profile.updated",
      entity: "User",
      entityId: userId,
      actor: {
        id: userId,
        name: updated.fullName,
        branchId: String(updated.branchId),
      },
      metadata: {
        username: updated.username,
        fields: Object.keys(payload),
      },
    });

    return serializeUser(
      (await this.users.findLeanById(userId)) as LeanUserRecord,
    );
  }
}
