import type { NextRequest } from "next/server";

import type { AuthenticatedUser } from "@/lib/auth/auth";
import { jsonError, jsonSuccess, type ErrorCode } from "@/utils/http";
import {
  roleCreateSchema,
  roleListQuerySchema,
  roleUpdateSchema,
} from "@/validators/rbac";

import { RoleManagementService } from "@/services/role-management-service";

function toStatus(code: string | undefined): {
  status: number;
  errorCode: ErrorCode;
} {
  switch (code) {
    case "CONFLICT":
      return { status: 409, errorCode: "CONFLICT" };
    case "NOT_FOUND":
      return { status: 404, errorCode: "NOT_FOUND" };
    case "FORBIDDEN":
    case "ROLE_PROTECTED":
    case "ROLE_IN_USE":
      return { status: 403, errorCode: "FORBIDDEN" };
    case "VALIDATION_ERROR":
      return { status: 400, errorCode: "VALIDATION_ERROR" };
    default:
      return { status: 500, errorCode: "INTERNAL_ERROR" };
  }
}

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : "Operation failed";
  const code = (error as { code?: string } | null)?.code;
  const mapped = toStatus(code);
  return jsonError(mapped.status, message, mapped.errorCode);
}

export async function listRolesController(req: NextRequest) {
  const parsed = roleListQuerySchema.safeParse(
    Object.fromEntries(new URL(req.url).searchParams.entries()),
  );

  if (!parsed.success) {
    return jsonError(
      400,
      "Invalid input",
      "VALIDATION_ERROR",
      parsed.error.flatten(),
    );
  }

  try {
    const service = new RoleManagementService();
    const result = await service.listRoles(parsed.data);
    return jsonSuccess({
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function getRoleController(id: string) {
  try {
    const service = new RoleManagementService();
    const role = await service.getRole(id);
    return jsonSuccess(role);
  } catch (error) {
    return handleError(error);
  }
}

export async function createRoleController(
  req: NextRequest,
  actor: AuthenticatedUser,
) {
  const parsed = roleCreateSchema.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    return jsonError(
      400,
      "Invalid input",
      "VALIDATION_ERROR",
      parsed.error.flatten(),
    );
  }

  try {
    const service = new RoleManagementService();
    const role = await service.createRole(parsed.data, actor);
    return jsonSuccess(role, 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function updateRoleController(
  req: NextRequest,
  id: string,
  actor: AuthenticatedUser,
) {
  const parsed = roleUpdateSchema.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    return jsonError(
      400,
      "Invalid input",
      "VALIDATION_ERROR",
      parsed.error.flatten(),
    );
  }

  try {
    const service = new RoleManagementService();
    const role = await service.updateRole(id, parsed.data, actor);
    return jsonSuccess(role);
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteRoleController(
  id: string,
  actor: AuthenticatedUser,
) {
  try {
    const service = new RoleManagementService();
    const role = await service.deleteRole(id, actor);
    return jsonSuccess(role);
  } catch (error) {
    return handleError(error);
  }
}
