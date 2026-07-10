import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/auth";
import { NotificationService } from "@/services/notification-service";
import { jsonError, jsonSuccess } from "@/utils/http";

export const dynamic = "force-dynamic";

export const PATCH = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const service = new NotificationService();
      const data = await service.markAsRead(id);
      return jsonSuccess(data, 200, "Notification marked as read");
    } catch (e: unknown) {
      return jsonError(400, (e as Error).message || "Failed to update notification", "VALIDATION_ERROR");
    }
  }
);
