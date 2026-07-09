import { connectToDatabase } from "@/lib/mongoose";
import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { jsonError, jsonSuccess } from "@/utils/http";
import { TableRepository } from "@/lib/table-management/table-repository";
import { TableService } from "@/lib/table-management/table-service";
import { tableStatusPatchSchema } from "@/validation/table-management";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type Params = { id: string; action: string };

export const PATCH = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<Params> }) => {
    const denied = await requirePermission("tables.manage")(req);
    if (denied) return denied;

    try {
      await connectToDatabase();
      const parsed = tableStatusPatchSchema.parse({
        id: (await params).id,
        action: (await params).action,
      });

      const service = new TableService(new TableRepository());
      const data = await service.changeStatus({
        id: parsed.id,
        action: parsed.action,
        user: req.user!,
      });

      return jsonSuccess(data);
    } catch {
      return jsonError(400, "Invalid request", "INVALID_TRANSITION");
    }
  },
);
