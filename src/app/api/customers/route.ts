import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { repositories } from "@/lib/data-access";
import { customerUpsertSchema } from "@/validation/domain";
import { jsonSuccess } from "@/utils/http";

export const GET = requireAuth(async (req) => {
  const denied = await requirePermission("customers.manage")(req);
  if (denied) return denied;

  await connectToDatabase();
  const customers = await repositories.customers.list({});
  return jsonSuccess(customers, 200, "Customers retrieved");
});

export const POST = requireAuth(async (req) => {
  const denied = await requirePermission("customers.manage")(req);
  if (denied) return denied;

  const body = customerUpsertSchema.parse(await req.json());
  await connectToDatabase();
  const customer = await repositories.customers.create(body);
  return jsonSuccess(customer, 201, "Customer created");
});
