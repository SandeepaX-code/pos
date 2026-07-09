import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { repositories } from "@/lib/data-access";
import { inventoryItemUpsertSchema } from "@/validation/admin";
import { jsonSuccess } from "@/utils/http";

export const GET = requireAuth(async (req) => {
  const denied = await requirePermission("inventory.view")(req);
  if (denied) return denied;

  await connectToDatabase();
  const items = await repositories.inventories.list({});
  return jsonSuccess(items, 200, "Inventory items retrieved");
});

export const POST = requireAuth(async (req) => {
  const denied = await requirePermission("inventory.create")(req);
  if (denied) return denied;

  const parsed = inventoryItemUpsertSchema.parse(await req.json());
  await connectToDatabase();
  const item = await repositories.inventories.create(parsed);
  return jsonSuccess(item, 201, "Inventory item created");
});
