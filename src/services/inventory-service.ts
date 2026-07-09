import mongoose, { ClientSession } from "mongoose";
import { connectToDatabase } from "@/lib/mongoose";
import { InventoryRepository } from "@/repositories/inventory-repository";
import { RecipeRepository } from "@/repositories/recipe-repository";
import { StockMovementModel } from "@/models/stock-movement";
import { OrderModel } from "@/models/order";
import { ActivityLogModel } from "@/models/activity-log";
import type { OrderItem } from "@/types/domain";

type UserActor = { id?: string; fullName?: string } | null | undefined;
type ErrorWithMissing = Error & { missingItems?: unknown[] };

export class InventoryService {
  private readonly inventory = new InventoryRepository();
  private readonly recipes = new RecipeRepository();

  async computeRequiredInventoryForItems(items: OrderItem[], branchId: string) {
    await connectToDatabase();
    const required: Map<
      string,
      {
        inventoryId: string;
        productId: mongoose.Types.ObjectId;
        quantity: number;
        unit?: string;
        name?: string;
      }
    > = new Map();

    for (const item of items) {
      const productId = new mongoose.Types.ObjectId(item.productId);
      const quantityOrdered = item.quantity ?? 1;

      const recipe = await this.recipes.findLeanOne({ productId });
      if (!recipe) {
        const inv = await this.inventory.findLeanOne({ productId, branchId });
        if (!inv) {
          return {
            required,
            missingItems: [
              { productId: String(productId), required: quantityOrdered },
            ],
          };
        }

        const key = String(inv._id);
        const prev = required.get(key);
        required.set(key, {
          inventoryId: key,
          productId: inv.productId as mongoose.Types.ObjectId,
          quantity: (prev?.quantity ?? 0) + quantityOrdered,
          unit: inv.unit,
          name: inv.name,
        });
        continue;
      }

      const yieldCount = recipe.yieldCount ?? 1;
      for (const ing of recipe.ingredients) {
        const ingredientProductId = new mongoose.Types.ObjectId(
          String(ing.productId),
        );
        const inv = await this.inventory.findLeanOne({
          productId: ingredientProductId,
          branchId,
        });
        if (!inv) {
          return {
            required,
            missingItems: [
              {
                productId: String(ingredientProductId),
                required: (ing.quantity * quantityOrdered) / yieldCount,
              },
            ],
          };
        }

        const baseQty = (ing.quantity * quantityOrdered) / yieldCount;
        const wasteMultiplier = 1 + (ing.wastageRate ?? 0) / 100;
        const needQty = baseQty * wasteMultiplier;

        const key = String(inv._id);
        const prev = required.get(key);
        required.set(key, {
          inventoryId: key,
          productId: inv.productId as mongoose.Types.ObjectId,
          quantity: (prev?.quantity ?? 0) + needQty,
          unit: inv.unit,
          name: inv.name,
        });
      }
    }

    const missingItems: Array<Record<string, unknown>> = [];
    for (const [invId, { quantity }] of required) {
      const inv = await this.inventory.findLeanById(invId);
      if (!inv) {
        missingItems.push({ inventoryId: invId, required: quantity });
        continue;
      }

      if (inv.stockOnHand < quantity) {
        missingItems.push({
          inventoryId: invId,
          name: inv.name,
          available: inv.stockOnHand,
          required: quantity,
        });
      }
    }

    return { required, missingItems };
  }

  async performOrderInventoryDeduction(orderId: string, user?: UserActor) {
    await connectToDatabase();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await OrderModel.findById(orderId)
        .session(session)
        .lean()
        .exec();
      if (!order) throw new Error("Order not found");

      const branchId = String(order.branchId);

      const required: Map<
        string,
        {
          productId: mongoose.Types.ObjectId;
          quantity: number;
          unit?: string;
          name?: string;
        }
      > = new Map();

      for (const item of order.items) {
        const productId = new mongoose.Types.ObjectId(item.productId);
        const quantityOrdered = item.quantity ?? 1;

        const recipe = await this.recipes.findLeanOne({ productId });
        if (!recipe) {
          const inv = await this.inventory.findOne(
            { productId, branchId },
            session,
          );
          if (!inv) {
            const missing = [
              { productId: String(productId), required: quantityOrdered },
            ];
            const err = new Error("Insufficient inventory") as ErrorWithMissing;
            err.missingItems = missing;
            throw err;
          }

          const key = String(inv._id);
          const prev = required.get(key);
          required.set(key, {
            productId: inv.productId as mongoose.Types.ObjectId,
            quantity: (prev?.quantity ?? 0) + quantityOrdered,
            unit: inv.unit,
            name: inv.name,
          });
          continue;
        }

        const yieldCount = recipe.yieldCount ?? 1;
        for (const ing of recipe.ingredients) {
          const ingredientProductId = new mongoose.Types.ObjectId(
            String(ing.productId),
          );
          const inv = await this.inventory.findOne(
            { productId: ingredientProductId, branchId },
            session,
          );
          if (!inv) {
            const missing = [
              {
                productId: String(ingredientProductId),
                required: (ing.quantity * quantityOrdered) / yieldCount,
              },
            ];
            const err = new Error("Insufficient inventory") as ErrorWithMissing;
            err.missingItems = missing;
            throw err;
          }

          const baseQty = (ing.quantity * quantityOrdered) / yieldCount;
          const wasteMultiplier = 1 + (ing.wastageRate ?? 0) / 100;
          const needQty = baseQty * wasteMultiplier;

          const key = String(inv._id);
          const prev = required.get(key);
          required.set(key, {
            productId: inv.productId as mongoose.Types.ObjectId,
            quantity: (prev?.quantity ?? 0) + needQty,
            unit: inv.unit,
            name: inv.name,
          });
        }
      }

      const missingItems: Array<Record<string, unknown>> = [];
      for (const [invId, { quantity }] of required) {
        const inv = await this.inventory.findById(invId, session);
        if (!inv) {
          missingItems.push({ inventoryId: invId, required: quantity });
          continue;
        }

        if (inv.stockOnHand < quantity) {
          missingItems.push({
            inventoryId: invId,
            name: inv.name,
            available: inv.stockOnHand,
            required: quantity,
          });
        }
      }

      if (missingItems.length > 0) {
        const err = new Error("Insufficient inventory") as ErrorWithMissing;
        err.missingItems = missingItems;
        throw err;
      }

      const movements: unknown[] = [];
      for (const [invId, { quantity }] of required) {
        const inv = await this.inventory.findById(invId, session);
        if (!inv) continue;

        inv.stockOnHand = Math.max(inv.stockOnHand - quantity, 0);
        inv.lastCountedAt = new Date();
        await inv.save({ session });

        const movement = await StockMovementModel.create(
          [
            {
              inventoryId: inv._id,
              productId: inv.productId,
              type: "out",
              quantity,
              reason: "sale",
              referenceType: "Order",
              referenceId: order._id,
              createdBy: user?.id
                ? new mongoose.Types.ObjectId(user.id)
                : undefined,
              branchId: order.branchId,
            },
          ],
          { session },
        );

        movements.push(movement);
      }

      await OrderModel.updateOne(
        { _id: order._id },
        { $set: { inventoryDeductedAt: new Date() } },
      )
        .session(session)
        .exec();

      await ActivityLogModel.create(
        [
          {
            userId: user?.id
              ? new mongoose.Types.ObjectId(user.id)
              : undefined,
            userName: user?.fullName ?? "",
            action: "inventory_deducted",
            entity: "Order",
            entityId: order._id,
            branchId: order.branchId,
            metadata: {
              orderNumber: order.orderNumber,
              movementsCount: movements.length,
            },
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      return {
        success: true,
        movementsCount: movements.length,
      };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  async adjustInventory(input: {
    inventoryId: string;
    type: "in" | "out" | "waste" | "adjustment";
    quantity: number;
    reason: string;
    referenceType?: string;
    referenceId?: string;
    createdBy: string;
    branchId: string;
  }) {
    await connectToDatabase();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const inv = await this.inventory.findById(input.inventoryId, session);
      if (!inv) {
        throw new Error("Inventory item not found");
      }

      const delta =
        input.type === "out" || input.type === "waste"
          ? -input.quantity
          : input.quantity;

      const newStock = Math.max(inv.stockOnHand + delta, 0);
      await this.inventory.updateStockWithSession(
        input.inventoryId,
        newStock,
        session,
      );

      await StockMovementModel.create(
        [
          {
            inventoryId: inv._id,
            productId: inv.productId,
            type: input.type,
            quantity: input.quantity,
            reason: input.reason,
            referenceType: input.referenceType,
            referenceId: input.referenceId
              ? new mongoose.Types.ObjectId(input.referenceId)
              : undefined,
            createdBy: new mongoose.Types.ObjectId(input.createdBy),
            branchId: new mongoose.Types.ObjectId(input.branchId),
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      return this.inventory.findLeanById(input.inventoryId);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }
}
