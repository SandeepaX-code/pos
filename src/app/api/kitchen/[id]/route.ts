import { NextRequest } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { KitchenService } from "@/services/kitchen-service";
import { jsonError, jsonSuccess } from "@/utils/http";

export const dynamic = "force-dynamic";

type AllowedStatus = "pending" | "preparing" | "ready" | "delivered";

export const GET = requireAuth(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("kitchen.view")(req);
    if (denied) return denied;

    try {
      const { id } = await params;
      const service = new KitchenService();
      const data = await service.getById(id);
      return jsonSuccess(data, 200, "Kitchen order retrieved");
    } catch (e: unknown) {
      return jsonError(404, (e as Error).message || "Kitchen order not found", "NOT_FOUND");
    }
  }
);

export const PATCH = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("kitchen.update")(req);
    if (denied) return denied;

    try {
      const { id } = await params;
      const body = (await req.json()) as { status: AllowedStatus };
      if (!body.status) {
        return jsonError(400, "Status is required", "VALIDATION_ERROR");
      }
      
      const service = new KitchenService();
      const data = await service.updateStatus(id, body.status, req.user?.id);
      return jsonSuccess(data, 200, `Kitchen order status updated to ${body.status}`);
    } catch (e: unknown) {
      return jsonError(400, (e as Error).message || "Failed to update status", "VALIDATION_ERROR");
    }
  }
);
