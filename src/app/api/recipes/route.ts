import { NextRequest } from "next/server";
import { requireAuth, requireRole, type AuthenticatedRequest } from "@/lib/auth/auth";
import { jsonError, jsonSuccess } from "@/utils/http";
import { RecipeService } from "@/services/recipe-service";
import { recipeUpsertSchema } from "@/validation/admin";

export const GET = requireAuth(async (_req: NextRequest) => {
  // list recipes
  const service = new RecipeService();
  const list = await service.list();
  return jsonSuccess(list, 200, "Recipes retrieved");
});

export const POST = requireAuth(async (req: AuthenticatedRequest) => {
  // role guard
  const roleCheck = await requireRole("superAdmin", "admin", "inventoryManager")(req);
  if (roleCheck) return roleCheck;

  const body = await req.json().catch(() => null);
  const parsed = recipeUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Invalid input", "VALIDATION_ERROR", parsed.error.flatten());
  }

  try {
    const service = new RecipeService();
    const created = await service.create(parsed.data);
    return jsonSuccess(created, 201, "Recipe created");
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to create recipe";
    const code = (e as { code?: string } | null)?.code;
    if (code === "ALREADY_EXISTS") return jsonError(409, message, "CONFLICT");
    return jsonError(500, message, "INTERNAL_ERROR");
  }
});
