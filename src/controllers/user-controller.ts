import type { NextRequest } from "next/server";

import type { AuthenticatedUser } from "@/lib/auth/auth";
import { jsonError, jsonSuccess, type ErrorCode } from "@/utils/http";
import {
  userChangePasswordSchema,
  userCreateSchema,
  userListQuerySchema,
  userProfileUpdateSchema,
  userResetPasswordSchema,
  userStatusSchema,
  userUpdateSchema,
} from "@/validators/rbac";

import { UserManagementService } from "@/services/user-management-service";

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
      return { status: 403, errorCode: "FORBIDDEN" };
    case "USER_ROLE_ESCALATION":
    case "SELF_DELETE_FORBIDDEN":
    case "SELF_ROLE_ESCALATION":
    case "ROLE_PROTECTED":
    case "ROLE_IN_USE":
      return { status: 403, errorCode: "FORBIDDEN" };
    case "INVALID_CURRENT_PASSWORD":
    case "PASSWORD_REUSED":
      return { status: 400, errorCode: "VALIDATION_ERROR" };
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

export async function listUsersController(req: NextRequest) {
  const parsed = userListQuerySchema.safeParse(
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
    const service = new UserManagementService();
    const result = await service.listUsers(parsed.data);
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

export async function getUserController(id: string, detailed = false) {
  try {
    const service = new UserManagementService();
    const user = detailed
      ? await service.getUserDetails(id)
      : await service.getUser(id);
    return jsonSuccess(user);
  } catch (error) {
    return handleError(error);
  }
}

export async function createUserController(
  req: NextRequest,
  actor: AuthenticatedUser,
) {
  const parsed = userCreateSchema.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    return jsonError(
      400,
      "Invalid input",
      "VALIDATION_ERROR",
      parsed.error.flatten(),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { confirmPassword, ...payload } = parsed.data;

  try {
    const service = new UserManagementService();
    const user = await service.createUser(payload, actor);
    return jsonSuccess(user, 201, "User created successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function updateUserController(
  req: NextRequest,
  id: string,
  actor: AuthenticatedUser,
) {
  const parsed = userUpdateSchema.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    return jsonError(
      400,
      "Invalid input",
      "VALIDATION_ERROR",
      parsed.error.flatten(),
    );
  }

  try {
    const service = new UserManagementService();
    const user = await service.updateUser(id, parsed.data, actor);
    return jsonSuccess(user, 200, "User updated successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteUserController(
  id: string,
  actor: AuthenticatedUser,
) {
  try {
    const service = new UserManagementService();
    const user = await service.deleteUser(id, actor);
    return jsonSuccess(user, 200, "User deleted successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function setUserStatusController(
  req: NextRequest,
  id: string,
  actor: AuthenticatedUser,
) {
  const parsed = userStatusSchema.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    return jsonError(
      400,
      "Invalid input",
      "VALIDATION_ERROR",
      parsed.error.flatten(),
    );
  }

  try {
    const service = new UserManagementService();
    const user = await service.setUserStatus(id, parsed.data.active, actor);
    return jsonSuccess(
      user,
      200,
      parsed.data.active ? "User activated successfully" : "User deactivated successfully",
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function resetPasswordController(
  req: NextRequest,
  id: string,
  actor: AuthenticatedUser,
) {
  const body = await req.json().catch(() => ({}));
  const parsed = userResetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(
      400,
      "Invalid input",
      "VALIDATION_ERROR",
      parsed.error.flatten(),
    );
  }

  try {
    const service = new UserManagementService();
    const result = await service.resetPassword(
      id,
      parsed.data.newPassword,
      actor,
    );
    return jsonSuccess(
      result,
      200,
      "Password reset successfully. User must change password on next login.",
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function changePasswordController(
  req: NextRequest,
  actor: AuthenticatedUser,
) {
  const parsed = userChangePasswordSchema.safeParse(
    await req.json().catch(() => null),
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
    const service = new UserManagementService();
    const user = await service.changePassword(actor.id, {
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    });
    return jsonSuccess(user, 200, "Password changed successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function getProfileController(actor: AuthenticatedUser) {
  try {
    const service = new UserManagementService();
    const profile = await service.getProfile(actor.id);
    return jsonSuccess(profile);
  } catch (error) {
    return handleError(error);
  }
}

export async function updateProfileController(
  req: NextRequest,
  actor: AuthenticatedUser,
) {
  const parsed = userProfileUpdateSchema.safeParse(
    await req.json().catch(() => null),
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
    const service = new UserManagementService();
    const profile = await service.updateProfile(actor.id, parsed.data);
    return jsonSuccess(profile, 200, "Profile updated successfully");
  } catch (error) {
    return handleError(error);
  }
}
