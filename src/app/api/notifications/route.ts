import { requireAuth } from "@/lib/auth/auth";
import { NotificationService } from "@/services/notification-service";
import { jsonSuccess, jsonError } from "@/utils/http";

export const dynamic = "force-dynamic";

export const GET = requireAuth(async (req) => {
  try {
    const service = new NotificationService();
    // Get recent/unread notifications for current user's branch
    const filter: Record<string, unknown> = { branchId: req.user?.branchId };
    
    // Optionally filter by recipient if user is cashier/waiter
    if (req.user?.role !== "superAdmin" && req.user?.role !== "admin") {
      filter.recipientId = req.user?.id;
    }
    
    const notifications = await service.list(filter);
    // Sort and limit results client-side or use service logic
    const sorted = notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);

    return jsonSuccess(sorted, 200, "Notifications retrieved");
  } catch (e: unknown) {
    return jsonError(500, (e as Error).message || "Failed to retrieve notifications", "INTERNAL_ERROR");
  }
});

export const POST = requireAuth(async (req) => {
  try {
    const service = new NotificationService();
    const recipientId = (req.user?.role !== "superAdmin" && req.user?.role !== "admin")
      ? req.user?.id
      : undefined;

    const branchId = req.user?.branchId;
    if (!branchId) {
      return jsonError(400, "Branch ID not found in session", "VALIDATION_ERROR");
    }

    const updated = await service.markAllAsRead(branchId, recipientId);
    return jsonSuccess(updated, 200, "All notifications marked as read");
  } catch (e: unknown) {
    return jsonError(500, (e as Error).message || "Failed to mark notifications as read", "INTERNAL_ERROR");
  }
});
