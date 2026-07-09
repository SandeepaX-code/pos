import { connectToDatabase } from "@/lib/mongoose";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { BranchModel } from "@/models/branch";
import { UserModel } from "@/models/user";
import { UsersManager } from "@/components/admin/users-manager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await connectToDatabase();
  const [users, branches] = await Promise.all([
    UserModel.find().sort({ createdAt: -1 }).lean().exec(),
    BranchModel.find().sort({ name: 1 }).lean().exec(),
  ]);

  const serializableUsers = JSON.parse(JSON.stringify(users));
  const serializableBranches = JSON.parse(JSON.stringify(branches));

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="Users"
        title="Role-based user administration"
        description="Create, update, disable, and delete staff accounts with branch assignment and secure password handling."
      />
      <Card>
        <CardContent>
          <UsersManager
            users={serializableUsers}
            branches={serializableBranches}
          />
        </CardContent>
      </Card>
    </main>
  );
}
