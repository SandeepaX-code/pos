import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongoose";
import { KitchenOrderRepository } from "@/repositories/kitchen-order-repository";
import { NotificationRepository } from "@/repositories/notification-repository";
import { OrderRepository } from "@/repositories/order-repository";

type AllowedStatus = "pending" | "preparing" | "ready" | "delivered";

export class KitchenService {
  private readonly kitchenOrders = new KitchenOrderRepository();
  private readonly notifications = new NotificationRepository();
  private readonly orders = new OrderRepository();

  async list(filter: Record<string, unknown> = {}) {
    await connectToDatabase();
    return this.kitchenOrders.list(filter);
  }

  async getById(id: string) {
    await connectToDatabase();
    const kitchenOrder = await this.kitchenOrders.findLeanById(id);
    if (!kitchenOrder) {
      throw new Error("Kitchen order not found");
    }
    return kitchenOrder;
  }

  async updateStatus(id: string, nextStatus: AllowedStatus, userId?: string) {
    await connectToDatabase();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const kitchenOrder = await this.kitchenOrders.findById(id, session);
      if (!kitchenOrder) {
        throw new Error("Kitchen order not found");
      }

      const currentStatus = kitchenOrder.status as AllowedStatus;
      
      // Validate strict transitions: pending -> preparing -> ready -> delivered
      const isValidTransition = 
        (currentStatus === "pending" && nextStatus === "preparing") ||
        (currentStatus === "preparing" && nextStatus === "ready") ||
        (currentStatus === "ready" && nextStatus === "delivered");

      if (!isValidTransition) {
        throw new Error(
          `Invalid state transition from "${currentStatus}" to "${nextStatus}". KDS workflow requires: pending -> preparing -> ready -> delivered.`
        );
      }

      // Update kitchen order status
      const updatePayload: Record<string, unknown> = { status: nextStatus };
      if (nextStatus === "delivered") {
        updatePayload.deliveredAt = new Date();
      }
      
      const updatedKitchenOrder = await this.kitchenOrders.updateById(id, updatePayload, session);

      // If the next status is ready, automatically trigger notification for the waiter/cashier
      if (nextStatus === "ready") {
        await this.notifications.create({
          title: "Order Ready",
          message: `Order #${kitchenOrder.orderNumber} for Table ${kitchenOrder.tableLabel || "Take Away"} is ready to be served.`,
          type: "kitchen-ready",
          severity: "info",
          branchId: kitchenOrder.branchId,
          recipientId: kitchenOrder.waiterId,
          metadata: {
            orderId: kitchenOrder.orderId,
            kitchenOrderId: kitchenOrder._id,
            tableLabel: kitchenOrder.tableLabel,
          },
        }, session);
      }

      // Sync the parent Order status to "ready" or "delivered" (to stay consistent with POS and receipts)
      if (kitchenOrder.orderId) {
        // Sync Order status
        const orderStatusMap: Record<string, string> = {
          preparing: "preparing",
          ready: "ready",
          delivered: "delivered"
        };
        const syncedStatus = orderStatusMap[nextStatus];
        if (syncedStatus) {
          await this.orders.updateById(String(kitchenOrder.orderId), { status: syncedStatus }, session);
        }
      }

      await session.commitTransaction();
      session.endSession();

      return updatedKitchenOrder;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }
}
