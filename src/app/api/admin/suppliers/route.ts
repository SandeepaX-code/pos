import { NextRequest } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { jsonError, jsonSuccess } from "@/utils/http";
import { SupplierService } from "@/services/supplier-service";

export const GET = requireAuth(async (req: NextRequest) => {
  const denied = await requirePermission("suppliers.view")(req);
  if (denied) return denied;

  try {
    const service = new SupplierService();
    const list = await service.list();
    return jsonSuccess(list, 200, "Suppliers retrieved");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve suppliers";
    return jsonError(500, message, "INTERNAL_ERROR");
  }
});

export const POST = requireAuth(async (req: NextRequest) => {
  const denied = await requirePermission("suppliers.create")(req);
  if (denied) return denied;

  try {
    const body = await req.json().catch(() => null);
    const service = new SupplierService();
    const created = await service.create(body);
    return jsonSuccess(created, 201, "Supplier created");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create supplier";
    return jsonError(400, message, "VALIDATION_ERROR");
  }
});
