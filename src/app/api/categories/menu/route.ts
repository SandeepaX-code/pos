import { jsonSuccess, jsonError } from "@/utils/http";
import { CategoryService } from "@/services/category-service";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const service = new CategoryService();
    const menu = await service.getMenuWithProducts();
    return jsonSuccess(menu, 200, "Categories with products retrieved");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve category menu";
    return jsonError(500, message, "INTERNAL_ERROR");
  }
};
