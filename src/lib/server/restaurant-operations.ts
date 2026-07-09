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
  const parsed = checkoutOrderSchema.parse(input);
  await connectToDatabase();

  const subtotal = sumLineItems(parsed.items);
  const branch = parsed.branchId;
  const tax = Math.round(subtotal * 0.08);
  const serviceCharge = Math.round(subtotal * 0.05);
  const grandTotal = Math.max(
    subtotal - parsed.discount + tax + serviceCharge,
    0,
  );

  const orderNumber = `ORD-${new Date().getTime().toString().slice(-6)}`;

  const order = await OrderModel.create({
    orderNumber,
    branchId: branch,
    tableId: parsed.tableId,
    customerId: parsed.customerId,
    waiterId: parsed.waiterId,
    cashierId: parsed.cashierId,
    customerName: parsed.customerName,
    waiterName: parsed.waiterName,
    tableLabel: parsed.tableLabel,
    status: "paid",
    priority: parsed.priority,
    items: parsed.items,
    subtotal,
    discount: parsed.discount,
    tax,
    serviceCharge,
    grandTotal,
    notes: parsed.notes,
    source: parsed.source,
  });

  const bill = await BillModel.create({
    invoiceNumber: `INV-${orderNumber}`,
    orderId: order._id,
    branchId: branch,
    tableId: parsed.tableId,
    customerId: parsed.customerId,
    cashierId: parsed.cashierId ?? parsed.waiterId,
    cashierName: parsed.waiterName,
    tableLabel: parsed.tableLabel,
    customerName: parsed.customerName,
    items: parsed.items,
    subtotal,
    discount: parsed.discount,
    tax,
    serviceCharge,
    grandTotal,
    paymentMethod: parsed.paymentMethod,
    printedAt: new Date(),
  });

  const payment = await PaymentModel.create({
    orderId: order._id,
    billId: bill._id,
    branchId: branch,
    cashierId: parsed.cashierId ?? parsed.waiterId,
    amount: grandTotal,
    method: parsed.paymentMethod,
    status: "completed",
    paidAt: new Date(),
  });

  const kitchenOrder = await KitchenOrderModel.create({
    orderId: order._id,
    orderNumber,
    branchId: branch,
    tableId: parsed.tableId,
    tableLabel: parsed.tableLabel ?? "N/A",
    waiterId: parsed.waiterId,
    waiterName: parsed.waiterName,
    status: "pending",
    priority: parsed.priority,
    items: parsed.items,
    notes: parsed.notes,
    printedAt: new Date(),
  });

  if (parsed.tableId) {
    await RestaurantTableModel.findByIdAndUpdate(parsed.tableId, {
      status: "occupied",
      billId: bill._id,
    }).exec();
  }

  await NotificationModel.create({
    title: "Payment Completed",
    message: `Payment received for ${orderNumber}`,
    type: "payment-completed",
    severity: "info",
    branchId: branch,
    metadata: { orderId: order._id, billId: bill._id },
  });

  await ActivityLogModel.create({
    userId: parsed.waiterId,
    userName: parsed.waiterName,
    action: "checkout",
    entity: "Order",
    entityId: order._id,
    branchId: branch,
    metadata: { paymentMethod: parsed.paymentMethod, grandTotal },
  });

  const customerReceipt = parsed.printCustomerReceipt
    ? createEscPosPayload(
        buildCustomerReceiptLines(
          {
            id: String(order._id),
            orderNumber,
            tableLabel: parsed.tableLabel,
            waiterName: parsed.waiterName,
            customerName: parsed.customerName,
            status: "paid",
            items: parsed.items,
            subtotal,
            discount: parsed.discount,
            tax,
            serviceCharge,
            grandTotal,
            createdAt: new Date().toISOString(),
            priority: parsed.priority,
            notes: parsed.notes,
          },
          parsed.paymentMethod,
        ),
      )
    : null;

  const kitchenTicket = parsed.printKitchenTicket
    ? createEscPosPayload(
        buildKitchenReceiptLines({
          id: String(kitchenOrder._id),
          orderId: String(order._id),
          orderNumber,
          tableLabel: parsed.tableLabel ?? "N/A",
          waiterName: parsed.waiterName,
          status: "pending",
          items: parsed.items,
          notes: parsed.notes,
          createdAt: new Date().toISOString(),
          priority: parsed.priority,
        }),
      )
    : null;

  return {
    order,
    bill,
    payment,
    kitchenOrder,
    customerReceipt,
    kitchenTicket,
  };
}

export async function adjustInventory(input: unknown) {
  const parsed = inventoryAdjustmentSchema.parse(input);
  await connectToDatabase();

  const inventory = await InventoryModel.findById(parsed.inventoryId).exec();

  if (!inventory) {
    throw new Error("Inventory item not found");
  }

  const delta =
    parsed.type === "out" || parsed.type === "waste"
      ? -parsed.quantity
      : parsed.quantity;
  inventory.stockOnHand = Math.max(inventory.stockOnHand + delta, 0);
  inventory.lastCountedAt = new Date();
  await inventory.save();

  return inventory;
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
