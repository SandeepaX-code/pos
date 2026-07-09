import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { repositories } from "@/lib/data-access";
import { supplierUpsertSchema } from "@/validation/domain";
import { jsonSuccess } from "@/utils/http";

export const GET = requireAuth(async (req) => {
  const denied = await requirePermission("suppliers.manage")(req);
  if (denied) return denied;

  await connectToDatabase();
  const suppliers = await repositories.suppliers.list({});
  return jsonSuccess(suppliers, 200, "Suppliers retrieved");
});

export const POST = requireAuth(async (req) => {
  const denied = await requirePermission("suppliers.manage")(req);
  if (denied) return denied;

  const body = supplierUpsertSchema.parse(await req.json());
  await connectToDatabase();
  const supplier = await repositories.suppliers.create(body);
  return jsonSuccess(supplier, 201, "Supplier created");
});
