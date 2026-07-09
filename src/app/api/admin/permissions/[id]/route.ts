import type { NextRequest } from "next/server";
import { getPermissionController } from "@/controllers/permission-controller";
import { requireAuth, requirePermission } from "@/lib/auth/auth";

export const GET = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("roles.view")(req);
    if (denied) return denied;
    const { id } = await params;
    return getPermissionController(id);
  },
);
