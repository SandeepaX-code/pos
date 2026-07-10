import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { DashboardService } from "@/services/dashboard-service";
import { jsonSuccess, jsonError } from "@/utils/http";

export const dynamic = "force-dynamic";

export const GET = requireAuth(async (req) => {
  const denied = await requirePermission("dashboard.view")(req);
  if (denied) return denied;

  try {
    const service = new DashboardService();
    const branchId = req.user?.role === "superAdmin" ? undefined : req.user?.branchId;
    const summary = await service.getDashboardSummary(branchId);
    return jsonSuccess(summary, 200, "Dashboard summary retrieved");
  } catch (e: unknown) {
    return jsonError(500, (e as Error).message || "Failed to retrieve dashboard summary", "INTERNAL_ERROR");
  }
});
