import { NextRequest } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { jsonError, jsonSuccess } from "@/utils/http";
import { PurchaseOrderService } from "@/services/purchase-order-service";

export const GET = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("purchaseOrders.view")(req);
    if (denied) return denied;

    try {
      const { id } = await params;
      const service = new PurchaseOrderService();
      const po = await service.getById(id);
      return jsonSuccess(po, 200, "Purchase order retrieved");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Purchase order not found";
      return jsonError(404, message, "NOT_FOUND");
    }
  },
);

export const PATCH = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("purchaseOrders.update")(req);
    if (denied) return denied;

    try {
      const { id } = await params;
      const body = await req.json().catch(() => null);
      const service = new PurchaseOrderService();
      const updated = await service.update(id, body);
      return jsonSuccess(updated, 200, "Purchase order updated");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Purchase order not found";
      return jsonError(400, message, "VALIDATION_ERROR");
    }
  },
);

export const DELETE = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("purchaseOrders.delete")(req);
    if (denied) return denied;

    try {
      const { id } = await params;
      const service = new PurchaseOrderService();
      const deleted = await service.delete(id);
      return jsonSuccess(deleted, 200, "Purchase order deleted");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Purchase order not found";
      return jsonError(404, message, "NOT_FOUND");
    }
  },
);
