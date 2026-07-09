import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { productUpsertSchema } from "@/validation/admin";
import { jsonError, jsonSuccess } from "@/utils/http";
import { ProductService } from "@/services/product-service";

const listQuerySchema = z.object({
  search: z.string().max(160).optional(),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  available: z.coerce.boolean().optional(),
  branchId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  sortBy: z.enum(["name", "price", "stock", "createdAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const GET = requireAuth(async (req: NextRequest) => {
  const denied = await requirePermission("products.view")(req);
  if (denied) return denied;

  try {
    const parsed = listQuerySchema.safeParse(
      Object.fromEntries(new URL(req.url).searchParams),
    );

    if (!parsed.success) {
      return jsonError(400, "Invalid query parameters", "VALIDATION_ERROR", {
        errors: parsed.error.flatten(),
      });
    }

    const service = new ProductService();
    const result = await service.list(parsed.data);
    return jsonSuccess(result, 200, "Products retrieved");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list products";
    return jsonError(500, message, "INTERNAL_ERROR");
  }
});

export const POST = requireAuth(async (req: NextRequest) => {
  const denied = await requirePermission("products.create")(req);
  if (denied) return denied;

  try {
    const body = await req.json().catch(() => null);
    const parsed = productUpsertSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(400, "Invalid input", "VALIDATION_ERROR", {
        errors: parsed.error.flatten(),
      });
    }

    const service = new ProductService();
    const product = await service.create(parsed.data);
    return jsonSuccess(product, 201, "Product created successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    const code = (error as { code?: string } | null)?.code;

    if (code === "SKU_EXISTS") {
      return jsonError(409, message, "CONFLICT");
    }

    if (code === "CATEGORY_NOT_FOUND") {
      return jsonError(404, "Category not found", "NOT_FOUND");
    }

    return jsonError(500, message, "INTERNAL_ERROR");
  }
});
