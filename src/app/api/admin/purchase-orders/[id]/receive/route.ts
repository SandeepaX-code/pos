import { NextRequest } from "next/server";
import {
  requireAuth,
  requirePermission,
  type AuthenticatedRequest,
} from "@/lib/auth/auth";
import { jsonError, jsonSuccess } from "@/utils/http";
import { PurchaseOrderService } from "@/services/purchase-order-service";

export const POST = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("purchaseOrders.update")(req);
    if (denied) return denied;

    const actor = (req as AuthenticatedRequest).user;
    try {
      const { id } = await params;
      const service = new PurchaseOrderService();
      const updated = await service.receivePurchaseOrder(id, actor);
      return jsonSuccess(
        updated,
        200,
        "Purchase order marked as received and inventory updated",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to receive purchase order";
      return jsonError(400, message, "VALIDATION_ERROR");
    }
  },
);
