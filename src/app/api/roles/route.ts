import {
  createRoleController,
  listRolesController,
} from "@/controllers/role-controller";
import { requireAuth, requirePermission } from "@/lib/auth/auth";

export const GET = requireAuth(async (req) => {
  const denied = await requirePermission("roles.view")(req);
  if (denied) return denied;
  return listRolesController(req);
});

export const POST = requireAuth(async (req) => {
  const denied = await requirePermission("roles.create")(req);
  if (denied) return denied;
  return createRoleController(req, req.user!);
});
