import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { kitchenOrders } from "@/data/restaurant";

export default function KitchenPage() {
  return (
    <AppShell>
      <main className="space-y-6">
        <PageHeader
          eyebrow="Kitchen Display"
          title="Live kitchen ticket board"
          description="Track preparation, ready, and delivered statuses with large touch-friendly cards for pass-through kitchen operations."
        />

        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {kitchenOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <div className="bg-slate-950 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Order
                    </div>
                    <div className="mt-1 text-2xl font-semibold">
                      {order.orderNumber}
                    </div>
                  </div>
                  <Badge className="bg-orange-500/15 text-orange-200">
                    {order.priority}
                  </Badge>
                </div>
                <div className="mt-3 text-sm text-slate-300">
                  Table {order.tableLabel} · {order.waiterName}
                </div>
              </div>
              <CardContent className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.productId}
                    className="rounded-[18px] border border-orange-100 bg-orange-50/50 p-4"
                  >
                    <div className="font-semibold text-slate-950">
                      {item.quantity} x {item.name}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {item.notes ?? "No special notes"}
                    </div>
                  </div>
                ))}
                <div className="rounded-[18px] border border-dashed border-orange-200 p-4 text-sm text-slate-500">
                  Ordered at {new Date(order.createdAt).toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
