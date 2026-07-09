import { connectToDatabase } from "@/lib/mongoose";
import {
  buildCustomerReceiptLines,
  buildKitchenReceiptLines,
} from "@/lib/printer/receipts";
import { repositories } from "@/lib/data-access";
import { BillModel } from "@/models/bill";
import { InventoryModel } from "@/models/inventory";
import { KitchenOrderModel } from "@/models/kitchen-order";
import { NotificationModel } from "@/models/notification";
import { OrderModel } from "@/models/order";
import { PaymentModel } from "@/models/payment";
import { RestaurantTableModel } from "@/models/restaurant-table";
import { ActivityLogModel } from "@/models/activity-log";
import { createEscPosPayload } from "@/lib/server/receipt-bridge";
import { InventoryService } from "@/services/inventory-service";
import { CheckoutService } from "@/services/checkout-service";
import {
  checkoutOrderSchema,
  inventoryAdjustmentSchema,
  customerUpsertSchema,
  supplierUpsertSchema,
  tableUpsertSchema,
} from "@/validation/domain";
import type { OrderItem } from "@/types/domain";

function sumLineItems(items: OrderItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export async function checkoutOrder(input: unknown) {
  const service = new CheckoutService();
  return service.checkoutOrder(input);
}

export async function adjustInventory(input: unknown) {
  const parsed = inventoryAdjustmentSchema.parse(input);
  const service = new InventoryService();
  return service.adjustInventory({
    inventoryId: parsed.inventoryId,
    type: parsed.type,
    quantity: parsed.quantity,
    reason: parsed.reason,
    referenceType: parsed.referenceType ?? undefined,
    referenceId: parsed.referenceId ?? undefined,
    createdBy: parsed.createdBy,
    branchId: parsed.branchId,
  });
}

export async function upsertCustomer(input: unknown) {
  const parsed = customerUpsertSchema.parse(input);
  await connectToDatabase();

  return repositories.customers.create(parsed as never);
}

export async function upsertSupplier(input: unknown) {
  const parsed = supplierUpsertSchema.parse(input);
  await connectToDatabase();

  return repositories.suppliers.create(parsed as never);
}

export async function upsertTable(input: unknown) {
  const parsed = tableUpsertSchema.parse(input);
  await connectToDatabase();

  return repositories.restaurantTables.create(parsed as never);
}

export async function listDashboardSummary() {
  await connectToDatabase();

  const [ordersCount, inventoryCount, customerCount, reservationCount] =
    await Promise.all([
      repositories.orders.count({ status: { $ne: "void" } }),
      repositories.inventories.count({ stockOnHand: { $lte: 20 } }),
      repositories.customers.count({ active: true }),
      repositories.reservations.count({
        status: { $in: ["pending", "confirmed"] },
      }),
    ]);

  return {
    ordersCount,
    inventoryCount,
    customerCount,
    reservationCount,
  };
}
