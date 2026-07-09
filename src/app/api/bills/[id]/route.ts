import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/auth";
import { jsonError, jsonSuccess } from "@/utils/http";
import { CheckoutService } from "@/services/checkout-service";

export const GET = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const service = new CheckoutService();
      const bill = await service.getBillById(id);
      return jsonSuccess(bill, 200, "Bill retrieved successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to retrieve bill";
      return jsonError(404, message, "NOT_FOUND");
    }
  },
);
