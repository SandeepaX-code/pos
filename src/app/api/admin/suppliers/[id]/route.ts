import { NextRequest } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { jsonError, jsonSuccess } from "@/utils/http";
import { SupplierService } from "@/services/supplier-service";

export const GET = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("suppliers.view")(req);
    if (denied) return denied;

    try {
      const { id } = await params;
      const service = new SupplierService();
      const supplier = await service.getById(id);
      return jsonSuccess(supplier, 200, "Supplier retrieved");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Supplier not found";
      return jsonError(404, message, "NOT_FOUND");
    }
  },
);

export const PATCH = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("suppliers.update")(req);
    if (denied) return denied;

    try {
      const { id } = await params;
      const body = await req.json().catch(() => null);
      const service = new SupplierService();
      const updated = await service.update(id, body);
      return jsonSuccess(updated, 200, "Supplier updated");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Supplier not found";
      return jsonError(400, message, "VALIDATION_ERROR");
    }
  },
);

export const DELETE = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("suppliers.delete")(req);
    if (denied) return denied;

    try {
      const { id } = await params;
      const service = new SupplierService();
      const deleted = await service.delete(id);
      return jsonSuccess(deleted, 200, "Supplier deleted");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Supplier not found";
      return jsonError(404, message, "NOT_FOUND");
    }
  },
);
