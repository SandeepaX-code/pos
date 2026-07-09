import type { NextRequest } from "next/server";

import {
  deleteUserController,
  getUserController,
  updateUserController,
} from "@/controllers/user-controller";
import { requireAuth, requirePermission } from "@/lib/auth/auth";

export const GET = requireAuth(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("users.view")(req);
    if (denied) return denied;
    const { id } = await params;
    return getUserController(id, true);
  },
);

export const PUT = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("users.update")(req);
    if (denied) return denied;
    const { id } = await params;
    return updateUserController(req, id, req.user!);
  },
);

export const DELETE = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("users.delete")(req);
    if (denied) return denied;
    const { id } = await params;
    return deleteUserController(id, req.user!);
  },
);
