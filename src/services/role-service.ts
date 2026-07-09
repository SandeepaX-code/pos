import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/mongoose";
import { PermissionModel } from "@/models/permission";

import { ActivityLogService } from "./activity-log-service";
import { RoleRepository } from "@/repositories/role-repository";

type Actor = {
  id: string;
  role: string;
  permissions: string[];
  branchId?: string;
  fullName?: string;
};

type LeanPermissionRecord = {
  _id: unknown;
  key: string;
  label: string;
};

type LeanRoleRecord = {
  _id: unknown;
  name: string;
  label: string;
  description?: string | null;
  active: boolean;
  system: boolean;
  permissions?: Array<LeanPermissionRecord | unknown>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type RoleResponseItem = {
  id: string;
  name: string;
  label: string;
  description?: string;
  active: boolean;
  system: boolean;
  permissions: Array<{ id: string; key: string; label: string }>;
  createdAt?: string;
  updatedAt?: string;
};

function serializeRole(role: LeanRoleRecord): RoleResponseItem {
  return {
    id: String(role._id),
    name: role.name,
    label: role.label,
    description: role.description ?? undefined,
    active: Boolean(role.active),
    system: Boolean(role.system),
    permissions: Array.isArray(role.permissions)
      ? role.permissions.map((permission) => {
          const candidate = permission as
            | LeanPermissionRecord
            | { _id?: unknown; key?: string; label?: string };
          return {
            id: String(candidate._id ?? permission),
            key: candidate.key ?? "",
            label: candidate.label ?? "",
          };
        })
      : [],
    createdAt: role.createdAt
      ? new Date(role.createdAt).toISOString()
      : undefined,
    updatedAt: role.updatedAt
      ? new Date(role.updatedAt).toISOString()
      : undefined,
  };
}

function assertRoleAdminAccess(actor: Actor) {
  if (!["superAdmin", "admin"].includes(actor.role)) {
    throw Object.assign(new Error("Forbidden"), { code: "FORBIDDEN" as const });
  }
}

function assertCanManageSystemRole(
  actor: Actor,
  role: { name: string; system?: boolean },
) {
  if (
    role.system ||
    [
      "superAdmin",
      "admin",
      "cashier",
      "waiter",
      "kitchenStaff",
      "inventoryManager",
      "accountant",
    ].includes(role.name)
  ) {
    if (actor.role !== "superAdmin") {
      throw Object.assign(new Error("System roles are protected"), {
        code: "ROLE_PROTECTED" as const,
      });
    }
  }
}

export class RoleService {
  private readonly roles = new RoleRepository();
  private readonly activity = new ActivityLogService();

  async listRoles(input: {
    search?: string;
    active?: boolean;
    page: number;
    limit: number;
  }) {
    await connectToDatabase();
    const { items, total } = await this.roles.list(
      { search: input.search, active: input.active },
      { page: input.page, limit: input.limit },
    );

    return {
      items: items.map((role) => serializeRole(role)),
      total,
      page: input.page,
      limit: input.limit,
      totalPages: Math.max(1, Math.ceil(total / input.limit)),
    };
  }

  async getRole(id: string) {
    await connectToDatabase();
    const role = await this.roles.findLeanById(id);
    if (!role) {
      throw Object.assign(new Error("Role not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    return serializeRole(role);
  }

  async createRole(
    input: {
      name: string;
      label: string;
      description?: string;
      permissions: string[];
      active: boolean;
    },
    actor: Actor,
  ) {
    await connectToDatabase();
    assertRoleAdminAccess(actor);

    const existing = await this.roles.findByName(input.name);
    if (existing) {
      throw Object.assign(new Error("Role already exists"), {
        code: "CONFLICT" as const,
      });
    }

    assertCanManageSystemRole(actor, { name: input.name, system: false });

    const permissions = await PermissionModel.find({
      _id: {
        $in: input.permissions.map(
          (permissionId) => new Types.ObjectId(permissionId),
        ),
      },
    })
      .lean()
      .exec();

    if (permissions.length !== input.permissions.length) {
      throw Object.assign(new Error("One or more permissions are invalid"), {
        code: "VALIDATION_ERROR" as const,
      });
    }

    const role = await this.roles.create({
      name: input.name,
      label: input.label,
      description: input.description,
      permissions: permissions.map(
        (permission) => new Types.ObjectId(permission._id),
      ),
      active: input.active,
      system: false,
    });

    await this.activity.log({
      action: "role.created",
      entity: "Role",
      entityId: String(role._id),
      actor: {
        id: actor.id,
        name: actor.fullName ?? actor.id,
        branchId: actor.branchId ?? "000000000000000000000000",
      },
      metadata: { name: role.name, label: role.label },
    });

    return serializeRole(await this.roles.findLeanById(String(role._id)));
  }

  async updateRole(
    id: string,
    input: {
      label?: string;
      description?: string;
      permissions?: string[];
      active?: boolean;
    },
    actor: Actor,
  ) {
    await connectToDatabase();
    assertRoleAdminAccess(actor);

    const existing = await this.roles.findById(id);
    if (!existing) {
      throw Object.assign(new Error("Role not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    assertCanManageSystemRole(actor, {
      name: existing.name,
      system: existing.system,
    });

    const permissions = input.permissions
      ? await PermissionModel.find({
          _id: {
            $in: input.permissions.map(
              (permissionId) => new Types.ObjectId(permissionId),
            ),
          },
        })
          .lean()
          .exec()
      : [];

    if (input.permissions && permissions.length !== input.permissions.length) {
      throw Object.assign(new Error("One or more permissions are invalid"), {
        code: "VALIDATION_ERROR" as const,
      });
    }

    const payload: Record<string, unknown> = {
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(permissions.length
        ? { permissions: permissions.map((permission) => permission._id) }
        : {}),
    };

    const updated = await this.roles.updateById(id, payload);
    if (!updated) {
      throw Object.assign(new Error("Role not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    await this.activity.log({
      action: "role.updated",
      entity: "Role",
      entityId: id,
      actor: {
        id: actor.id,
        name: actor.fullName ?? actor.id,
        branchId: actor.branchId ?? "000000000000000000000000",
      },
      metadata: { name: updated.name, label: updated.label },
    });

    return serializeRole(await this.roles.findLeanById(id));
  }

  async deleteRole(id: string, actor: Actor) {
    await connectToDatabase();
    assertRoleAdminAccess(actor);

    const existing = await this.roles.findById(id);
    if (!existing) {
      throw Object.assign(new Error("Role not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    assertCanManageSystemRole(actor, {
      name: existing.name,
      system: existing.system,
    });

    const usersInRole = await this.roles.countUsersByRoleId(id);
    if (usersInRole > 0) {
      throw Object.assign(new Error("Role is in use"), {
        code: "ROLE_IN_USE" as const,
      });
    }

    const deleted = await this.roles.deleteById(id);
    if (!deleted) {
      throw Object.assign(new Error("Role not found"), {
        code: "NOT_FOUND" as const,
      });
    }

    await this.activity.log({
      action: "role.deleted",
      entity: "Role",
      entityId: id,
      actor: {
        id: actor.id,
        name: actor.fullName ?? actor.id,
        branchId: actor.branchId ?? "000000000000000000000000",
      },
      metadata: { name: deleted.name, label: deleted.label },
    });

    return serializeRole(deleted);
  }
}
