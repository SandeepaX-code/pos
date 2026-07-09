import type { NextRequest } from "next/server";

import { setUserStatusController } from "@/controllers/user-controller";
import { requireAuth, requirePermission } from "@/lib/auth/auth";

export const PATCH = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("users.disable")(req);
    if (denied) return denied;
    const { id } = await params;
    return setUserStatusController(req, id, req.user!);
  },
);
