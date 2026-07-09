import { checkoutOrder } from "@/lib/server/restaurant-operations";
import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { repositories } from "@/lib/data-access";
import { jsonSuccess, jsonError } from "@/utils/http";

export const GET = requireAuth(async (req) => {
  const denied = await requirePermission("orders.view")(req);
  if (denied) return denied;

  await connectToDatabase();
  const orders = await repositories.orders.list({});
  return jsonSuccess(orders, 200, "Orders retrieved");
});

export const POST = requireAuth(async (req) => {
  const denied = await requirePermission("orders.create")(req);
  if (denied) return denied;

  const body = await req.json();
  try {
    const result = await checkoutOrder(body);
    return jsonSuccess(result, 201, "Order created");
  } catch (e: unknown) {
    const missing = (e as { missingItems?: unknown })?.missingItems;
    if (missing) {
      // Return 400 with the required shape for insufficient inventory
      return jsonError(400, "Insufficient inventory.", "VALIDATION_ERROR", { missingItems: missing as unknown });
    }

    throw e;
  }
});
