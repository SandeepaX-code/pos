import { connectToDatabase } from "@/lib/mongoose";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { BranchModel } from "@/models/branch";
import { BranchesManager } from "@/components/admin/branches-manager";

export const dynamic = "force-dynamic";

export default async function AdminBranchesPage() {
  await connectToDatabase();
  const branches = await BranchModel.find()
    .sort({ createdAt: -1 })
    .lean()
    .exec();
  const serializableBranches = JSON.parse(JSON.stringify(branches));

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="Branches"
        title="Branch configuration"
        description="Create and manage locations, tax settings, service charges, and currency rules."
      />
      <Card>
        <CardContent>
          <BranchesManager branches={serializableBranches} />
        </CardContent>
      </Card>
    </main>
  );
}
