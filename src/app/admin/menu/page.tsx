import { connectToDatabase } from "@/lib/mongoose";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryModel } from "@/models/category";
import { ProductModel } from "@/models/product";
import { MenuManager } from "@/components/admin/menu-manager";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  await connectToDatabase();
  const [categories, products] = await Promise.all([
    CategoryModel.find().sort({ sortOrder: 1, name: 1 }).lean().exec(),
    ProductModel.find().sort({ createdAt: -1 }).lean().exec(),
  ]);

  const serializableCategories = JSON.parse(JSON.stringify(categories));
  const serializableProducts = JSON.parse(JSON.stringify(products));

  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="Menu"
        title="Categories and products"
        description="Maintain menu categories, prices, images, stock, and availability with live edit and delete controls."
      />
      <Card>
        <CardContent>
          <MenuManager
            categories={serializableCategories}
            products={serializableProducts}
          />
        </CardContent>
      </Card>
    </main>
  );
}
