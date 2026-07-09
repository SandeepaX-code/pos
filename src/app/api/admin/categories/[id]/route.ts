import { NextRequest } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { categoryUpsertSchema } from "@/validation/admin";
import { jsonError, jsonSuccess } from "@/utils/http";
import { CategoryService } from "@/services/category-service";

export const GET = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("categories.manage")(req);
    if (denied) return denied;

    try {
      const { id } = await params;
      const service = new CategoryService();
      const category = await service.getById(id);
      return jsonSuccess(category, 200, "Category retrieved");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to retrieve category";
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
    const denied = await requirePermission("categories.manage")(req);
    if (denied) return denied;

    try {
      const { id } = await params;
      const body = await req.json().catch(() => null);
      const parsed = categoryUpsertSchema.partial().safeParse(body);

      if (!parsed.success) {
        return jsonError(400, "Invalid input", "VALIDATION_ERROR", {
          errors: parsed.error.flatten(),
        });
      }

      const service = new CategoryService();
      const category = await service.update(id, parsed.data);
      return jsonSuccess(category, 200, "Category updated successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update category";
      const code = (error as { code?: string } | null)?.code;

      if (code === "NOT_FOUND" || code === "INVALID_ID") {
        return jsonError(404, message, "NOT_FOUND");
      }

      if (code === "SLUG_EXISTS") {
        return jsonError(409, message, "CONFLICT");
      }

      return jsonError(500, message, "INTERNAL_ERROR");
    }
  },
);

export const DELETE = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("categories.manage")(req);
    if (denied) return denied;

    try {
      const { id } = await params;
      const service = new CategoryService();
      const deleted = await service.delete(id);
      return jsonSuccess(deleted, 200, "Category deleted successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete category";
      const code = (error as { code?: string } | null)?.code;

      if (code === "NOT_FOUND" || code === "INVALID_ID") {
        return jsonError(404, message, "NOT_FOUND");
      }

      if (code === "CATEGORY_IN_USE") {
        return jsonError(400, message, "VALIDATION_ERROR");
      }

      return jsonError(500, message, "INTERNAL_ERROR");
    }
  },
);
