import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { customers } from "@/data/restaurant";

export default function CustomersPage() {
  return (
    <AppShell>
      <main className="space-y-6">
        <PageHeader
          eyebrow="Customers"
          title="Customer registration and loyalty tracking"
          description="Customer profiles, loyalty points, favorite orders, and purchase history are ready for MongoDB-backed persistence."
        />

        <div className="grid gap-4 xl:grid-cols-2">
          {customers.map((customer) => (
            <Card key={customer.id}>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-2xl font-semibold text-slate-950">
                    {customer.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {customer.phone} · {customer.email}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] bg-orange-50 p-4">
                    <div className="text-sm text-slate-500">Loyalty points</div>
                    <div className="mt-2 text-2xl font-semibold text-slate-950">
                      {customer.loyaltyPoints}
                    </div>
                  </div>
                  <div className="rounded-[18px] bg-orange-50 p-4">
                    <div className="text-sm text-slate-500">
                      Favorite orders
                    </div>
                    <div className="mt-2 text-sm font-medium text-slate-950">
                      {customer.favoriteOrders.join(", ")}
                    </div>
                  </div>
                </div>
                <div className="rounded-[18px] border border-slate-100 bg-white p-4 text-sm text-slate-600 shadow-sm">
                  Address: {customer.address ?? "Not provided"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
