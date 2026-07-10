import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { ReportService } from "@/services/report-service";
import { jsonSuccess, jsonError } from "@/utils/http";

export const dynamic = "force-dynamic";

export const GET = requireAuth(async (req) => {
  const denied = await requirePermission("reports.view")(req);
  if (denied) return denied;

  try {
    const url = new URL(req.url);
    const fromStr = url.searchParams.get("from") || undefined;
    const toStr = url.searchParams.get("to") || undefined;

    const branchId = req.user?.role === "superAdmin"
      ? (url.searchParams.get("branchId") || undefined)
      : req.user?.branchId;

    const service = new ReportService();
    const data = await service.getProfitAndLoss(fromStr, toStr, branchId);
    return jsonSuccess(data, 200, "Profit and loss metrics retrieved");
  } catch (e: unknown) {
    return jsonError(500, (e as Error).message || "Failed to retrieve profit and loss", "INTERNAL_ERROR");
  }
});
