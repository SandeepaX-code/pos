import mongoose from "mongoose";
import { RecipeModel } from "@/models/recipe";
import { InventoryModel } from "@/models/inventory";
import { StockMovementModel } from "@/models/stock-movement";
import { OrderModel } from "@/models/order";
import { ActivityLogModel } from "@/models/activity-log";
import { connectToDatabase } from "@/lib/mongoose";

type User = { id?: string; fullName?: string } | null | undefined;

type ErrorWithMissing = Error & { missingItems?: unknown[] };

import type { OrderItem } from "@/types/domain";

/**
 * Computes required inventory aggregated per Inventory._id for a prospective set of order items
 * without making any DB mutations. Returns { required, missingItems } where required is a Map
 * keyed by inventoryId with aggregated quantities, and missingItems is an array of missing entries
 * if any inventory records or stocks are insufficient.
 */
export async function computeRequiredInventoryForItems(items: OrderItem[], branchId: string) {
  await connectToDatabase();

  const required: Map<string, { inventoryId: string; productId: mongoose.Types.ObjectId; quantity: number; unit?: string; name?: string }> = new Map();

  for (const item of items) {
    const productId = new mongoose.Types.ObjectId(item.productId);
    const quantityOrdered = item.quantity ?? 1;

    const recipe = await RecipeModel.findOne({ productId }).lean().exec();
    if (!recipe) {
      // no recipe -> deduct product-level inventory
      const inv = await InventoryModel.findOne({ productId, branchId }).lean().exec();
      if (!inv) {
        return { required, missingItems: [{ productId: String(productId), required: quantityOrdered }] };
      }

      const key = String(inv._id);
      const prev = required.get(key);
      required.set(key, { inventoryId: key, productId: inv.productId as mongoose.Types.ObjectId, quantity: (prev?.quantity ?? 0) + quantityOrdered, unit: inv.unit, name: inv.name });
      continue;
    }

    const yieldCount = recipe.yieldCount ?? 1;
    for (const ing of recipe.ingredients) {
      const ingredientProductId = new mongoose.Types.ObjectId(String(ing.productId));
      const inv = await InventoryModel.findOne({ productId: ingredientProductId, branchId }).lean().exec();
      if (!inv) {
        return { required, missingItems: [{ productId: String(ingredientProductId), required: (ing.quantity * quantityOrdered) / yieldCount }] };
      }

      const baseQty = (ing.quantity * quantityOrdered) / yieldCount;
      const wasteMultiplier = 1 + (ing.wastageRate ?? 0) / 100;
      const needQty = baseQty * wasteMultiplier;

      const key = String(inv._id);
      const prev = required.get(key);
      required.set(key, { inventoryId: key, productId: inv.productId as mongoose.Types.ObjectId, quantity: (prev?.quantity ?? 0) + needQty, unit: inv.unit, name: inv.name });
    }
  }

  // validate against stockOnHand
  const missingItems: Array<Record<string, unknown>> = [];
  for (const [invId, { quantity }] of required) {
    const inv = await InventoryModel.findById(invId).lean().exec();
    if (!inv) {
      missingItems.push({ inventoryId: invId, required: quantity });
      continue;
    }

    if (inv.stockOnHand < quantity) {
      missingItems.push({ inventoryId: invId, name: inv.name, available: inv.stockOnHand, required: quantity });
    }
  }

  return { required, missingItems };
}

export async function performOrderInventoryDeduction(orderId: string, user?: User) {
  // use shared connection helper to avoid duplicate connections
  await connectToDatabase();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await OrderModel.findById(orderId).session(session).lean().exec();
    if (!order) throw new Error("Order not found");

    const branchId = order.branchId as mongoose.Types.ObjectId;

    // aggregate required quantities per inventory product
    const required: Map<string, { productId: mongoose.Types.ObjectId; quantity: number; unit?: string; name?: string }> = new Map();

    for (const item of order.items) {
      const productId = item.productId as mongoose.Types.ObjectId;
      const quantityOrdered = item.quantity ?? 1;

      const recipe = await RecipeModel.findOne({ productId }).lean().exec();
      if (!recipe) {
        // If product has no recipe, try to deduct product-level inventory (Inventory.productId)
        const inv = await InventoryModel.findOne({ productId, branchId }).session(session).exec();
        if (!inv) {
          // missing inventory for this product
          const missing = [{ productId: String(productId), required: quantityOrdered }];
          const err = new Error("Insufficient inventory") as ErrorWithMissing;
          err.missingItems = missing;
          throw err;
        }

        const key = String(inv._id);
        const prev = required.get(key);
        const need = quantityOrdered;
        required.set(key, { productId: inv.productId as mongoose.Types.ObjectId, quantity: (prev?.quantity ?? 0) + need, unit: inv.unit, name: inv.name });
        continue;
      }

      // recipe exists -> compute per-ingredient required quantity
      const yieldCount = recipe.yieldCount ?? 1;

      for (const ing of recipe.ingredients) {
        const ingredientProductId = ing.productId as mongoose.Types.ObjectId;
        // find inventory item for this ingredient in branch
        const inv = await InventoryModel.findOne({ productId: ingredientProductId, branchId }).session(session).exec();
        if (!inv) {
          const missing = [{ productId: String(ingredientProductId), required: (ing.quantity * quantityOrdered) / yieldCount }];
          const err = new Error("Insufficient inventory") as ErrorWithMissing;
          err.missingItems = missing;
          throw err;
        }

        // compute needed quantity scaled by order qty and yield
        const baseQty = (ing.quantity * quantityOrdered) / yieldCount;
        const wasteMultiplier = 1 + (ing.wastageRate ?? 0) / 100;
        const needQty = baseQty * wasteMultiplier;

        const key = String(inv._id);
        const prev = required.get(key);
        required.set(key, { productId: inv.productId as mongoose.Types.ObjectId, quantity: (prev?.quantity ?? 0) + needQty, unit: inv.unit, name: inv.name });
      }
    }

    // check availability
    const missingItems: Array<Record<string, unknown>> = [];
    for (const [invId, { quantity }] of required) {
      const inv = await InventoryModel.findById(invId).session(session).exec();
      if (!inv) {
        missingItems.push({ inventoryId: invId, required: quantity });
        continue;
      }

      if (inv.stockOnHand < quantity) {
        missingItems.push({ inventoryId: invId, name: inv.name, available: inv.stockOnHand, required: quantity });
      }
    }

    if (missingItems.length > 0) {
      const err = new Error("Insufficient inventory") as ErrorWithMissing;
      err.missingItems = missingItems;
      throw err;
    }

    // perform deductions and create stock movements
    const movements: unknown[] = [];
    for (const [invId, { quantity }] of required) {
      const inv = await InventoryModel.findById(invId).session(session).exec();
      if (!inv) continue;
      inv.stockOnHand = Math.max(inv.stockOnHand - quantity, 0);
      inv.lastCountedAt = new Date();
      await inv.save({ session });

      const movement = await StockMovementModel.create([
        {
          inventoryId: inv._id,
          productId: inv.productId,
          type: "out",
          quantity,
          reason: "sale",
          referenceType: "Order",
          referenceId: order._id,
          createdBy: user?.id ? new mongoose.Types.ObjectId(user.id) : undefined,
          branchId: order.branchId,
        },
      ], { session });

      movements.push(movement);
    }

    // mark order as inventoryDeductedAt
    await OrderModel.updateOne({ _id: order._id }, { $set: { inventoryDeductedAt: new Date() } }).session(session).exec();

    // activity log
    await ActivityLogModel.create([
      {
        userId: user?.id ? new mongoose.Types.ObjectId(user.id) : undefined,
        userName: user?.fullName ?? "",
        action: "inventory_deducted",
        entity: "Order",
        entityId: order._id,
        branchId: order.branchId,
        metadata: { orderNumber: order.orderNumber, movementsCount: movements.length },
      },
    ], { session });

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
