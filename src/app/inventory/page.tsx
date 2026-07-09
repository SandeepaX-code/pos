import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { inventory, suppliers } from "@/data/restaurant";

export default function InventoryPage() {
  return (
    <AppShell>
      <main className="space-y-6">
        <PageHeader
          eyebrow="Inventory"
          title="Stock control and expiry tracking"
          description="Track low stock items, expiry dates, and supplier coverage with a restaurant-ready inventory view."
        />

        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-separate border-spacing-y-3 text-left">
                <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  <tr>
                    <th className="px-4 py-2">Item</th>
                    <th className="px-4 py-2">On hand</th>
                    <th className="px-4 py-2">Reserved</th>
                    <th className="px-4 py-2">Reorder</th>
                    <th className="px-4 py-2">Expiry</th>
                    <th className="px-4 py-2">Barcode</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr
                      key={item.id}
                      className="rounded-[20px] bg-orange-50/50"
                    >
                      <td className="rounded-l-[18px] px-4 py-4 font-medium text-slate-950">
                        {item.name}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {item.stockOnHand} {item.unit}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {item.stockReserved}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {item.reorderLevel}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {item.expiryDate}
                      </td>
                      <td className="rounded-r-[18px] px-4 py-4 text-slate-700">
                        {item.barcode}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-3">
                <div className="text-lg font-semibold text-slate-950">
                  Low stock alerts
                </div>
                {inventory
                  .filter((item) => item.stockOnHand <= item.reorderLevel)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[18px] border border-orange-100 bg-orange-50/70 p-4"
                    >
                      <div className="font-medium text-slate-950">
                        {item.name}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        Reorder threshold reached. Supplier follow-up required.
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3">
                <div className="text-lg font-semibold text-slate-950">
                  Primary suppliers
                </div>
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="rounded-[18px] border border-slate-100 bg-white p-4 shadow-sm"
                  >
                    <div className="font-medium text-slate-950">
                      {supplier.company}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {supplier.contactName}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
