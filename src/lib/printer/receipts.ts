import type { Order, KitchenOrder } from "@/types/domain";

import { buildEscPosReceipt, type ReceiptLine } from "@/lib/printer/escpos";
import { restaurantBrand } from "@/data/restaurant";

const currency = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

function orderItemsLines(order: Order | KitchenOrder) {
  return order.items.flatMap((item) =>
    [
      { label: `${item.quantity} x ${item.name}` },
      item.notes ? { label: `  Note: ${item.notes}` } : null,
    ].filter(Boolean),
  ) as ReceiptLine[];
}

export function buildCustomerReceiptLines(
  order: Order,
  paymentMethod: string,
): ReceiptLine[] {
  const orderAny = order as unknown as {
    source?: "dine-in" | "takeaway" | string;
  };

  const modeLabel =
    // backend stores in order.source but the frontend type `Order` may not expose it
    // fallback to tableLabel heuristic if source isn't present.
    typeof orderAny.source === "string"
      ? orderAny.source === "dine-in"
        ? "Dine-in"
        : orderAny.source === "takeaway"
          ? "Takeaway"
          : "POS"
      : order.tableLabel
        ? "Dine-in"
        : "Takeaway";

  return [
    { label: restaurantBrand.name, align: "center", bold: true },
    { label: restaurantBrand.address, align: "center" },
    { label: restaurantBrand.phone, align: "center" },
    { label: `Invoice: ${order.orderNumber}`, bold: true },
    { label: `Order type: ${modeLabel}`, align: "center" },
    { label: `Customer: ${order.customerName ?? "Walk-in"}` },
    { label: `Cashier: ${order.waiterName}` },
    { label: `Table: ${order.tableLabel ?? "N/A"}` },
    { label: "Items", bold: true },
    ...orderItemsLines(order),
    { label: `Subtotal: ${currency.format(order.subtotal)}` },
    { label: `Discount: ${currency.format(order.discount)}` },
    { label: `Tax: ${currency.format(order.tax)}` },
    { label: `Service: ${currency.format(order.serviceCharge)}` },
    { label: `Grand Total: ${currency.format(order.grandTotal)}`, bold: true },
    { label: `Payment: ${paymentMethod.toUpperCase()}` },
    { label: "Thank you for dining with us.", align: "center" },
  ];
}

export function buildKitchenReceiptLines(
  order: Order | KitchenOrder,
): ReceiptLine[] {
  return [
    { label: restaurantBrand.name, align: "center", bold: true },
    { label: `KOT: ${order.orderNumber}`, bold: true },
    { label: `Table: ${order.tableLabel ?? "N/A"}` },
    { label: `Waiter: ${order.waiterName}` },
    { label: "Items", bold: true },
    ...orderItemsLines(order),
    { label: `Time: ${new Date(order.createdAt).toLocaleTimeString()}` },
  ];
}

export function createCustomerReceipt(order: Order, paymentMethod: string) {
  return buildEscPosReceipt(buildCustomerReceiptLines(order, paymentMethod));
}

export function createKitchenReceipt(order: Order | KitchenOrder) {
  return buildEscPosReceipt(buildKitchenReceiptLines(order));
}
