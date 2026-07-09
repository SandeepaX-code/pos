import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/auth";
import { jsonError, jsonSuccess } from "@/utils/http";
import { CheckoutService } from "@/services/checkout-service";

export const GET = requireAuth(async (req: NextRequest) => {
  try {
    const service = new CheckoutService();
    const bills = await service.listBills();
    return jsonSuccess(bills, 200, "Bills retrieved successfully");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve bills";
    return jsonError(500, message, "INTERNAL_ERROR");
  }
});
