import { connectToDatabase } from "@/lib/mongoose";
import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { jsonError, jsonSuccess } from "@/utils/http";
import { TableRepository } from "@/lib/table-management/table-repository";
import { TableService } from "@/lib/table-management/table-service";
import { tableIdParamSchema } from "@/validation/table-management";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type Params = { id: string };

export const PATCH = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<Params> }) => {
    const denied = await requirePermission("tables.manage")(req);
    if (denied) return denied;

    try {
      await connectToDatabase();
      const { id } = tableIdParamSchema.parse(await params);
      const service = new TableService(new TableRepository());
      const data = await service.changeStatus({
        id,
        action: "clean",
        user: req.user!,
      });
      return jsonSuccess(data);
    } catch {
      return jsonError(400, "Invalid request", "INVALID_TRANSITION");
    }
  },
);
