import { adjustInventory } from "@/lib/server/restaurant-operations";
import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { adminInventoryAdjustmentSchema } from "@/validation/admin";
import { jsonError, jsonSuccess } from "@/utils/http";

export const POST = requireAuth(async (req) => {
  const denied = await requirePermission("inventory.update")(req);
  if (denied) return denied;

  try {
    const parsed = adminInventoryAdjustmentSchema.parse(await req.json());
    const item = await adjustInventory(parsed);
    return jsonSuccess(item, 200, "Inventory adjusted");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Inventory adjustment failed";
    return jsonError(400, message, "VALIDATION_ERROR");
  }
});
