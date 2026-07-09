import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { listDashboardSummary } from "@/lib/server/restaurant-operations";
import { jsonSuccess } from "@/utils/http";

export const GET = requireAuth(async (req) => {
  const denied = await requirePermission("dashboard.view")(req);
  if (denied) return denied;

  await connectToDatabase();
  const summary = await listDashboardSummary();
  return jsonSuccess(summary, 200, "Dashboard summary retrieved");
});
