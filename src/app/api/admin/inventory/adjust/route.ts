import { InventoryService } from "@/services/inventory-service";
import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { adminInventoryAdjustmentSchema } from "@/validation/admin";
import { jsonError, jsonSuccess } from "@/utils/http";

export const POST = requireAuth(async (req) => {
  const denied = await requirePermission("inventory.update")(req);
  if (denied) return denied;

  try {
    const parsed = adminInventoryAdjustmentSchema.parse(await req.json());
    const service = new InventoryService();
    const item = await service.adjustInventory({
      inventoryId: parsed.inventoryId,
      type: parsed.type,
      quantity: parsed.quantity,
      reason: parsed.reason,
      referenceType: parsed.referenceType ?? undefined,
      referenceId: parsed.referenceId ?? undefined,
      createdBy: parsed.createdBy,
      branchId: parsed.branchId,
    });
    return jsonSuccess(item, 200, "Inventory adjusted");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Inventory adjustment failed";
    return jsonError(400, message, "VALIDATION_ERROR");
  }
});
