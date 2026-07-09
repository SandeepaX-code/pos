import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { repositories } from "@/lib/data-access";
import { inventoryItemUpsertSchema } from "@/validation/admin";
import { jsonError, jsonSuccess } from "@/utils/http";

export const PATCH = requireAuth(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("inventory.update")(req);
    if (denied) return denied;

    const { id } = await params;
    const parsed = inventoryItemUpsertSchema.parse(await req.json());
    await connectToDatabase();
    const item = await repositories.inventories.updateById(id, parsed);

    if (!item) {
      return jsonError(404, "Inventory item not found", "NOT_FOUND");
    }

    return jsonSuccess(item, 200, "Inventory item updated");
  },
);

export const DELETE = requireAuth(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("inventory.delete")(req);
    if (denied) return denied;

    const { id } = await params;
    await connectToDatabase();
    const deleted = await repositories.inventories.deleteById(id);

    if (!deleted) {
      return jsonError(404, "Inventory item not found", "NOT_FOUND");
    }

    return jsonSuccess(deleted, 200, "Inventory item deleted");
  },
);
