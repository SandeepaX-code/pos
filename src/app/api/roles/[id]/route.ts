import type { NextRequest } from "next/server";

import {
  deleteRoleController,
  getRoleController,
  updateRoleController,
} from "@/controllers/role-controller";
import { requireAuth, requirePermission } from "@/lib/auth/auth";

export const GET = requireAuth(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("roles.view")(req);
    if (denied) return denied;
    const { id } = await params;
    return getRoleController(id);
  },
);

export const PUT = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("roles.update")(req);
    if (denied) return denied;
    const { id } = await params;
    return updateRoleController(req, id, req.user!);
  },
);

export const DELETE = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("roles.delete")(req);
    if (denied) return denied;
    const { id } = await params;
    return deleteRoleController(id, req.user!);
  },
);
