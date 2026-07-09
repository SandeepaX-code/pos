import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongoose";
import { PurchaseOrderRepository } from "@/repositories/purchase-order-repository";
import { InventoryRepository } from "@/repositories/inventory-repository";
import { StockMovementModel } from "@/models/stock-movement";

type UserActor = { id?: string; fullName?: string } | null | undefined;

export class PurchaseOrderService {
  private readonly pos = new PurchaseOrderRepository();
  private readonly inventory = new InventoryRepository();

  async list(filter: Record<string, unknown> = {}) {
    await connectToDatabase();
    return this.pos.list(filter);
  }

  async getById(id: string) {
    await connectToDatabase();
    const po = await this.pos.findLeanById(id);
    if (!po) {
      throw new Error("Purchase order not found");
    }
    return po;
  }

  async create(payload: Record<string, unknown>) {
    await connectToDatabase();
    if (
      payload.purchaseOrderNumber &&
      typeof payload.purchaseOrderNumber === "string"
    ) {
      const existing = await this.pos.findByPoNumber(
        payload.purchaseOrderNumber,
      );
      if (existing) {
        throw new Error("Purchase order number must be unique");
      }
    }
    return this.pos.create(payload);
  }

  async update(id: string, payload: Record<string, unknown>) {
    await connectToDatabase();
    if (
      payload.purchaseOrderNumber &&
      typeof payload.purchaseOrderNumber === "string"
    ) {
      const existing = await this.pos.findByPoNumber(
        payload.purchaseOrderNumber,
      );
      if (existing && String(existing._id) !== id) {
        throw new Error("Purchase order number must be unique");
      }
    }
    const updated = await this.pos.updateById(id, payload);
    if (!updated) {
      throw new Error("Purchase order not found");
    }
    return updated;
  }

  async delete(id: string) {
    await connectToDatabase();
    const deleted = await this.pos.deleteById(id);
    if (!deleted) {
      throw new Error("Purchase order not found");
    }
    return deleted;
  }

  async receivePurchaseOrder(poId: string, user: UserActor) {
    await connectToDatabase();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const po = await this.pos.findById(poId, session);
      if (!po) {
        throw new Error("Purchase order not found");
      }

      if (po.status === "received") {
        throw new Error("Purchase order is already received");
      }
      if (po.status === "cancelled") {
        throw new Error("Cannot receive a cancelled purchase order");
      }

      po.status = "received";
      po.receivedDate = new Date();
      await po.save({ session });

      const createdBy = user?.id
        ? new mongoose.Types.ObjectId(user.id)
        : new mongoose.Types.ObjectId();

      for (const item of po.items) {
        const productId = item.productId;
        const branchId = po.branchId;
        const qtyToReceive =
          item.quantityReceived > 0
            ? item.quantityReceived
            : item.quantityOrdered;

        let inv = await this.inventory.findOne(
          { productId, branchId },
          session,
        );
        if (!inv) {
          inv = await this.inventory.create(
            {
              productId,
              branchId,
              name: item.name,
              unit: item.unit,
              stockOnHand: qtyToReceive,
              reorderLevel: 10,
            },
            session,
          );
        } else {
          inv.stockOnHand += qtyToReceive;
          inv.lastCountedAt = new Date();
          await inv.save({ session });
        }

        await StockMovementModel.create(
          [
            {
              inventoryId: inv._id,
              productId: inv.productId,
              type: "in",
              quantity: qtyToReceive,
              reason: "purchase",
              referenceType: "PurchaseOrder",
              referenceId: po._id,
              createdBy,
              branchId: po.branchId,
            },
          ],
          { session },
        );
      }

      await session.commitTransaction();
      session.endSession();

      return po;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }
}
