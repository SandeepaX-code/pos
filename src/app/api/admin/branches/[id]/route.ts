import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { BranchService } from "@/services/branch-service";
import { branchUpsertSchema } from "@/validation/admin";
import { jsonError, jsonSuccess } from "@/utils/http";

export const dynamic = "force-dynamic";

export const GET = requireAuth(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("branches.manage")(req);
    if (denied) return denied;

    try {
      const { id } = await params;
      const service = new BranchService();
      const branch = await service.getById(req.user!, id);
      return jsonSuccess(branch, 200, "Branch retrieved");
    } catch (e: unknown) {
      return jsonError(404, (e as Error).message || "Branch not found", "NOT_FOUND");
    }
  }
);

export const PATCH = requireAuth(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("branches.manage")(req);
    if (denied) return denied;

    try {
      const { id } = await params;
      const parsed = branchUpsertSchema.parse(await req.json());
      const service = new BranchService();
      const branch = await service.update(req.user!, id, parsed);
      return jsonSuccess(branch, 200, "Branch updated");
    } catch (e: unknown) {
      return jsonError(400, (e as Error).message || "Failed to update branch", "VALIDATION_ERROR");
    }
  }
);

export const DELETE = requireAuth(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("branches.manage")(req);
    if (denied) return denied;

    try {
      const { id } = await params;
      const service = new BranchService();
      const deleted = await service.delete(req.user!, id);
      return jsonSuccess(deleted, 200, "Branch deleted");
    } catch (e: unknown) {
      return jsonError(400, (e as Error).message || "Failed to delete branch", "VALIDATION_ERROR");
    }
  }
);
