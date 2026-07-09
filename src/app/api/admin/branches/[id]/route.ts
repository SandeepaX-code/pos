import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { repositories } from "@/lib/data-access";
import { branchUpsertSchema } from "@/validation/admin";
import { jsonError, jsonSuccess } from "@/utils/http";

export const PATCH = requireAuth(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("branches.manage")(req);
    if (denied) return denied;

    const { id } = await params;
    const parsed = branchUpsertSchema.parse(await req.json());
    await connectToDatabase();
    const branch = await repositories.branches.updateById(id, parsed);

    if (!branch) {
      return jsonError(404, "Branch not found", "NOT_FOUND");
    }

    return jsonSuccess(branch, 200, "Branch updated");
  },
);

export const DELETE = requireAuth(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("branches.manage")(req);
    if (denied) return denied;

    const { id } = await params;
    await connectToDatabase();
    const deleted = await repositories.branches.deleteById(id);

    if (!deleted) {
      return jsonError(404, "Branch not found", "NOT_FOUND");
    }

    return jsonSuccess(deleted, 200, "Branch deleted");
  },
);
