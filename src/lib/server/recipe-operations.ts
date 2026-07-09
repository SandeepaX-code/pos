import { InventoryService } from "@/services/inventory-service";
import type { OrderItem } from "@/types/domain";

type User = { id?: string; fullName?: string } | null | undefined;

export async function computeRequiredInventoryForItems(
  items: OrderItem[],
  branchId: string,
) {
  const service = new InventoryService();
  return service.computeRequiredInventoryForItems(items, branchId);
}

export async function performOrderInventoryDeduction(
  orderId: string,
  user?: User,
) {
  const service = new InventoryService();
  return service.performOrderInventoryDeduction(orderId, user);
}
