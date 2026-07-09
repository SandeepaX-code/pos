import { NextRequest } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { productUpsertSchema } from "@/validation/admin";
import { jsonError, jsonSuccess } from "@/utils/http";
import { ProductService } from "@/services/product-service";

export const GET = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("products.view")(req);
    if (denied) return denied;

    try {
      const { id } = await params;
      const service = new ProductService();
      const product = await service.getById(id);
      return jsonSuccess(product, 200, "Product retrieved");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to retrieve product";
      const code = (error as { code?: string } | null)?.code;

      if (code === "NOT_FOUND" || code === "INVALID_ID") {
        return jsonError(404, message, "NOT_FOUND");
      }

      return jsonError(500, message, "INTERNAL_ERROR");
    }
  },
);

export const PATCH = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("products.update")(req);
    if (denied) return denied;

    try {
      const { id } = await params;
      const body = await req.json().catch(() => null);
      const parsed = productUpsertSchema.partial().safeParse(body);

      if (!parsed.success) {
        return jsonError(400, "Invalid input", "VALIDATION_ERROR", {
          errors: parsed.error.flatten(),
        });
      }

      const service = new ProductService();
      const product = await service.update(id, parsed.data);
      return jsonSuccess(product, 200, "Product updated successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update product";
      const code = (error as { code?: string } | null)?.code;

      if (code === "NOT_FOUND" || code === "INVALID_ID") {
        return jsonError(404, message, "NOT_FOUND");
      }

      if (code === "SKU_EXISTS") {
        return jsonError(409, message, "CONFLICT");
      }

      if (code === "CATEGORY_NOT_FOUND") {
        return jsonError(404, "Category not found", "NOT_FOUND");
      }

      return jsonError(500, message, "INTERNAL_ERROR");
    }
  },
);

export const DELETE = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("products.delete")(req);
    if (denied) return denied;

    try {
      const { id } = await params;
      const service = new ProductService();
      const deleted = await service.delete(id);
      return jsonSuccess(deleted, 200, "Product deleted successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete product";
      const code = (error as { code?: string } | null)?.code;

      if (code === "NOT_FOUND" || code === "INVALID_ID") {
        return jsonError(404, message, "NOT_FOUND");
      }

      return jsonError(500, message, "INTERNAL_ERROR");
    }
  },
);
