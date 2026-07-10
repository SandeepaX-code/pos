import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { KitchenService } from "@/services/kitchen-service";
import { jsonSuccess, jsonError } from "@/utils/http";

export const dynamic = "force-dynamic";

export const GET = requireAuth(async (req) => {
  const denied = await requirePermission("kitchen.view")(req);
  if (denied) return denied;

  try {
    const service = new KitchenService();
    // Get active kitchen orders (pending, preparing, or ready) for user's branch
    const kitchenOrders = await service.list({
      status: { $in: ["pending", "preparing", "ready"] },
      branchId: req.user?.branchId,
    });
    
    // Sort by creation date descending
    const sorted = kitchenOrders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return jsonSuccess(sorted, 200, "Kitchen orders retrieved");
  } catch (e: unknown) {
    return jsonError(500, (e as Error).message || "Failed to retrieve kitchen orders", "INTERNAL_ERROR");
  }
});
