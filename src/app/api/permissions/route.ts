import { listPermissionsController } from "@/controllers/permission-controller";
import { requireAuth, requirePermission } from "@/lib/auth/auth";

export const GET = requireAuth(async (req) => {
  const denied = await requirePermission("roles.view")(req);
  if (denied) return denied;
  return listPermissionsController(req);
});
