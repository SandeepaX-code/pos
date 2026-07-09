import {
  createCustomerReceipt,
  createKitchenReceipt,
} from "@/lib/printer/receipts";
import { requireAnyPermission, requireAuth } from "@/lib/auth/auth";
import type { Order, KitchenOrder } from "@/types/domain";

export const POST = requireAuth(async (req) => {
  const denied = await requireAnyPermission("billing.print", "orders.checkout")(
    req,
  );
  if (denied) return denied;

  const body = (await req.json()) as {
    type: "customer" | "kitchen";
    paymentMethod?: string;
    order: Order | KitchenOrder;
  };

  const payload =
    body.type === "customer"
      ? createCustomerReceipt(body.order as Order, body.paymentMethod ?? "cash")
      : createKitchenReceipt(body.order);

  return new Response(payload, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename=${body.type}-receipt.bin`,
    },
  });
});
