import { NextRequest } from "next/server";
import { requireAuth, requireRole, type AuthenticatedRequest } from "@/lib/auth/auth";
import { jsonError, jsonSuccess } from "@/utils/http";
import { RecipeService } from "@/services/recipe-service";
import { recipeUpsertSchema } from "@/validation/admin";

export const GET = requireAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  try {
    const service = new RecipeService();
    const recipe = await service.getById(id);
    return jsonSuccess(recipe, 200, "Recipe retrieved");
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to get recipe";
    const code = (e as { code?: string } | null)?.code;
    if (code === "NOT_FOUND" || code === "INVALID_ID") return jsonError(404, message, "NOT_FOUND");
    return jsonError(500, message, "INTERNAL_ERROR");
  }
});

export const PUT = requireAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
  // role guard
  const roleCheck = await requireRole("superAdmin", "admin", "inventoryManager")(req);
  if (roleCheck) return roleCheck;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = recipeUpsertSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid input", "VALIDATION_ERROR", parsed.error.flatten());

  try {
    const service = new RecipeService();
    const updated = await service.update(id, parsed.data);
    return jsonSuccess(updated, 200, "Recipe updated");
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to update recipe";
    const code = (e as { code?: string } | null)?.code;
    if (code === "NOT_FOUND" || code === "INVALID_ID") return jsonError(404, message, "NOT_FOUND");
    return jsonError(500, message, "INTERNAL_ERROR");
  }
});

export const DELETE = requireAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
  // role guard
  const roleCheck = await requireRole("superAdmin", "admin", "inventoryManager")(req);
  if (roleCheck) return roleCheck;

  const { id } = await params;
  try {
    const service = new RecipeService();
    const deleted = await service.delete(id);
    return jsonSuccess(deleted, 200, "Recipe deleted");
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to delete recipe";
    const code = (e as { code?: string } | null)?.code;
    if (code === "NOT_FOUND" || code === "INVALID_ID") return jsonError(404, message, "NOT_FOUND");
    return jsonError(500, message, "INTERNAL_ERROR");
  }
});
