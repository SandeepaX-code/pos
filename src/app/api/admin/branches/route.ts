import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { BranchService } from "@/services/branch-service";
import { branchUpsertSchema } from "@/validation/admin";
import { jsonSuccess, jsonError } from "@/utils/http";

export const dynamic = "force-dynamic";

export const GET = requireAuth(async (req) => {
  const denied = await requirePermission("branches.manage")(req);
  if (denied) return denied;

  try {
    const service = new BranchService();
    const list = await service.list(req.user!);
    return jsonSuccess(list, 200, "Branches retrieved");
  } catch (e: unknown) {
    return jsonError(500, (e as Error).message || "Failed to retrieve branches", "INTERNAL_ERROR");
  }
});

export const POST = requireAuth(async (req) => {
  const denied = await requirePermission("branches.manage")(req);
  if (denied) return denied;

  try {
    const parsed = branchUpsertSchema.parse(await req.json());
    const service = new BranchService();
    const branch = await service.create(req.user!, parsed);
    return jsonSuccess(branch, 201, "Branch created");
  } catch (e: unknown) {
    return jsonError(400, (e as Error).message || "Failed to create branch", "VALIDATION_ERROR");
  }
});
