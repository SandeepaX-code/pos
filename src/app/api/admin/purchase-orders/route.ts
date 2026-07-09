import { NextRequest } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { jsonError, jsonSuccess } from "@/utils/http";
import { PurchaseOrderService } from "@/services/purchase-order-service";

export const GET = requireAuth(async (req: NextRequest) => {
  const denied = await requirePermission("purchaseOrders.view")(req);
  if (denied) return denied;

  try {
    const service = new PurchaseOrderService();
    const list = await service.list();
    return jsonSuccess(list, 200, "Purchase orders retrieved");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve purchase orders";
    return jsonError(500, message, "INTERNAL_ERROR");
  }
});

export const POST = requireAuth(async (req: NextRequest) => {
  const denied = await requirePermission("purchaseOrders.create")(req);
  if (denied) return denied;

  try {
    const body = await req.json().catch(() => null);
    const service = new PurchaseOrderService();
    const created = await service.create(body);
    return jsonSuccess(created, 201, "Purchase order created");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create purchase order";
    return jsonError(400, message, "VALIDATION_ERROR");
  }
});
