import { connectToDatabase } from "@/lib/mongoose";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { BranchModel } from "@/models/branch";
import { InventoryModel } from "@/models/inventory";
import { ProductModel } from "@/models/product";
import { InventoryManager } from "@/components/admin/inventory-manager";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  await connectToDatabase();
  const [inventory, products, branches] = await Promise.all([
    InventoryModel.find().sort({ createdAt: -1 }).lean().exec(),
    ProductModel.find().sort({ name: 1 }).lean().exec(),
    BranchModel.find().sort({ name: 1 }).lean().exec(),
  ]);

  const serializableInventory = JSON.parse(JSON.stringify(inventory));
  const serializableProducts = JSON.parse(JSON.stringify(products));
  const serializableBranches = JSON.parse(JSON.stringify(branches));

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Stock master and adjustments"
        description="Create stock items, update thresholds, and record inventory movements with protected admin endpoints."
      />
      <Card>
        <CardContent>
          <InventoryManager
            inventory={serializableInventory}
            products={serializableProducts}
            branches={serializableBranches}
          />
        </CardContent>
      </Card>
    </main>
  );
}
