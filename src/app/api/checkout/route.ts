import { NextRequest } from "next/server";
import { requireAuth, type AuthenticatedRequest } from "@/lib/auth/auth";
import { jsonError, jsonSuccess } from "@/utils/http";
import { CheckoutService } from "@/services/checkout-service";

export const POST = requireAuth(async (req: NextRequest) => {
  const actor = (req as AuthenticatedRequest).user;
  const body = await req.json().catch(() => null);

  try {
    const service = new CheckoutService();
    const result = await service.checkoutOrder(body, actor);
    return jsonSuccess(result, 201, "Checkout completed successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    const missing = (error as { missingItems?: unknown[] } | null)
      ?.missingItems;

    if (missing) {
      return jsonError(400, "Insufficient inventory.", "VALIDATION_ERROR", {
        missingItems: missing,
      });
    }

    return jsonError(500, message, "INTERNAL_ERROR");
  }
});
