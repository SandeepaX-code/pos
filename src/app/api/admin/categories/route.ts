import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { categoryUpsertSchema } from "@/validation/admin";
import { jsonError, jsonSuccess } from "@/utils/http";
import { CategoryService } from "@/services/category-service";

const listQuerySchema = z.object({
  search: z.string().max(160).optional(),
  active: z.coerce.boolean().optional(),
  sortBy: z.enum(["name", "sortOrder", "createdAt"]).default("sortOrder"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const GET = requireAuth(async (req: NextRequest) => {
  const denied = await requirePermission("categories.manage")(req);
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

    const service = new CategoryService();
    const result = await service.list(parsed.data);
    return jsonSuccess(result, 200, "Categories retrieved");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list categories";
    return jsonError(500, message, "INTERNAL_ERROR");
  }
});

export const POST = requireAuth(async (req: NextRequest) => {
  const denied = await requirePermission("categories.manage")(req);
  if (denied) return denied;

  try {
    const body = await req.json().catch(() => null);
    const parsed = categoryUpsertSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(400, "Invalid input", "VALIDATION_ERROR", {
        errors: parsed.error.flatten(),
      });
    }

    const service = new CategoryService();
    const category = await service.create(parsed.data);
    return jsonSuccess(category, 201, "Category created successfully");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create category";
    const code = (error as { code?: string } | null)?.code;

    if (code === "SLUG_EXISTS") {
      return jsonError(409, message, "CONFLICT");
    }

    return jsonError(500, message, "INTERNAL_ERROR");
  }
});
