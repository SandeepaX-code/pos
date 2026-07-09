import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { repositories } from "@/lib/data-access";
import { branchUpsertSchema } from "@/validation/admin";
import { jsonSuccess } from "@/utils/http";

export const GET = requireAuth(async (req) => {
  const denied = await requirePermission("branches.manage")(req);
  if (denied) return denied;

  await connectToDatabase();
  const branches = await repositories.branches.list({});
  return jsonSuccess(branches, 200, "Branches retrieved");
});

export const POST = requireAuth(async (req) => {
  const denied = await requirePermission("branches.manage")(req);
  if (denied) return denied;

  const parsed = branchUpsertSchema.parse(await req.json());
  await connectToDatabase();
  const branch = await repositories.branches.create(parsed);
  return jsonSuccess(branch, 201, "Branch created");
});
