import {
  createUserController,
  listUsersController,
} from "@/controllers/user-controller";
import { requireAuth, requirePermission } from "@/lib/auth/auth";

export const GET = requireAuth(async (req) => {
  const denied = await requirePermission("users.view")(req);
  if (denied) return denied;
  return listUsersController(req);
});

export const POST = requireAuth(async (req) => {
  const denied = await requirePermission("users.create")(req);
  if (denied) return denied;
  return createUserController(req, req.user!);
});
