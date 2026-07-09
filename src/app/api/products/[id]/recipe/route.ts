import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/auth";
import { jsonError, jsonSuccess } from "@/utils/http";
import { RecipeService } from "@/services/recipe-service";

export const GET = requireAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  try {
    const service = new RecipeService();
    const recipe = await service.getByProductId(id);
    if (!recipe) return jsonError(404, "Recipe not found", "NOT_FOUND");
    return jsonSuccess(recipe, 200, "Recipe retrieved");
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to get recipe";
    return jsonError(500, message, "INTERNAL_ERROR");
  }
});
