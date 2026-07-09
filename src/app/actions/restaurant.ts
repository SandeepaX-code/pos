"use server";

import {
  adjustInventory,
  checkoutOrder,
  listDashboardSummary,
  upsertCustomer,
  upsertSupplier,
  upsertTable,
} from "@/lib/server/restaurant-operations";

export async function checkoutOrderAction(input: unknown) {
  return checkoutOrder(input);
}

export async function adjustInventoryAction(input: unknown) {
  return adjustInventory(input);
}

export async function createCustomerAction(input: unknown) {
  return upsertCustomer(input);
}

export async function createSupplierAction(input: unknown) {
  return upsertSupplier(input);
}

export async function createTableAction(input: unknown) {
  return upsertTable(input);
}

export async function getDashboardSummaryAction() {
  return listDashboardSummary();
}
