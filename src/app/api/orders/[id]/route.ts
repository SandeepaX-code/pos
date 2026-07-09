import { z } from "zod";

import { requireAuth, requirePermission, type AuthenticatedRequest } from "@/lib/auth/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { repositories } from "@/lib/data-access";
import { jsonError, jsonSuccess } from "@/utils/http";

const orderUpdateSchema = z.object({
  status: z
    .enum(["pending", "preparing", "ready", "delivered", "paid", "void"])
    .optional(),
  discount: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
});

export const GET = requireAuth(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("orders.view")(req);
    if (denied) return denied;

    const { id } = await params;
    await connectToDatabase();
    const order = await repositories.orders.findById(id);

    if (!order) {
      return jsonError(404, "Order not found", "NOT_FOUND");
    }

    return jsonSuccess(order, 200, "Order retrieved");
  },
);

export const PATCH = requireAuth(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("orders.update")(req);
    if (denied) return denied;

    const { id } = await params;
    const payload = orderUpdateSchema.parse(await req.json());
    await connectToDatabase();

    // load existing order
    const existing = await repositories.orders.findById(id);
    if (!existing) return jsonError(404, "Order not found", "NOT_FOUND");

    const newStatus = payload.status ?? existing.status;

    // apply update
    const order = await repositories.orders.updateById(id, payload);
    if (!order) return jsonError(404, "Order not found", "NOT_FOUND");

    // If status moved to 'delivered' or 'paid' and inventory not yet deducted => attempt deduction
    const shouldDeduct = (newStatus === "delivered" || newStatus === "paid") && !existing.inventoryDeductedAt;
    if (shouldDeduct) {
      try {
        // perform inventory deduction and stock movements
        const { performOrderInventoryDeduction } = await import("@/lib/server/recipe-operations");
        const actor = (req as AuthenticatedRequest).user;
        const deductionResult = await performOrderInventoryDeduction(String(order._id), actor);
        // attach deduction info to response
        return jsonSuccess({ order, inventoryDeduction: deductionResult }, 200, "Order updated and inventory deducted");
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to deduct inventory";
        const missing = (e as { missingItems?: unknown })?.missingItems;
        if (missing) {
          return jsonError(400, "Insufficient inventory.", "VALIDATION_ERROR", { missingItems: missing as unknown });
        }
        return jsonError(500, message, "INTERNAL_ERROR");
      }
    }

    return jsonSuccess(order, 200, "Order updated");
  },
);

export const DELETE = requireAuth(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("orders.cancel")(req);
    if (denied) return denied;

    const { id } = await params;
    await connectToDatabase();
    const deleted = await repositories.orders.deleteById(id);

    if (!deleted) {
      return jsonError(404, "Order not found", "NOT_FOUND");
    }

    return jsonSuccess(deleted, 200, "Order cancelled");
  },
);
