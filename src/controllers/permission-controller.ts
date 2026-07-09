import type { NextRequest } from "next/server";
import { jsonError, jsonSuccess } from "@/utils/http";
import { permissionListQuerySchema } from "@/validators/rbac";
import { PermissionService } from "@/services/permission-service";

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : "Operation failed";
  const code = (error as { code?: string } | null)?.code;
  const status = code === "NOT_FOUND" ? 404 : 500;
  return jsonError(
    status,
    message,
    code === "NOT_FOUND" ? "NOT_FOUND" : "INTERNAL_ERROR",
  );
}

export async function listPermissionsController(req: NextRequest) {
  const parsed = permissionListQuerySchema.safeParse(
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
    const service = new PermissionService();
    const result = await service.listPermissions(parsed.data);
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

export async function getPermissionController(id: string) {
  try {
    const service = new PermissionService();
    const result = await service.getPermission(id);
    return jsonSuccess(result);
  } catch (error) {
    return handleError(error);
  }
}
