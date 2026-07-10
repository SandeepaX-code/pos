import { NextRequest } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { productPricePatchSchema } from "@/validation/admin";
import { jsonError, jsonSuccess } from "@/utils/http";
import { ProductService } from "@/services/product-service";

export const dynamic = "force-dynamic";

export const PATCH = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("products.update")(req);
    if (denied) return denied;

    try {
      const { id } = await params;
      const body = await req.json().catch(() => null);
      const parsed = productPricePatchSchema.safeParse(body);

      if (!parsed.success) {
        return jsonError(400, "Invalid price input", "VALIDATION_ERROR", {
          errors: parsed.error.flatten(),
        });
      }

      const service = new ProductService();
      const product = await service.update(id, { price: parsed.data.price });
      return jsonSuccess(product, 200, "Product price updated successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update product price";
      const code = (error as { code?: string } | null)?.code;

      if (code === "NOT_FOUND" || code === "INVALID_ID") {
        return jsonError(404, message, "NOT_FOUND");
      }

      return jsonError(500, message, "INTERNAL_ERROR");
    }
  }
);
