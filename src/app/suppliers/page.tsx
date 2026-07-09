import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { suppliers } from "@/data/restaurant";

export default function SuppliersPage() {
  return (
    <AppShell>
      <main className="space-y-6">
        <PageHeader
          eyebrow="Suppliers"
          title="Supplier management and procurement"
          description="Company contacts, product supply records, and purchase history hooks for the procurement pipeline."
        />

        <div className="grid gap-4 xl:grid-cols-2">
          {suppliers.map((supplier) => (
            <Card key={supplier.id}>
              <CardContent className="space-y-4">
                <div className="text-2xl font-semibold text-slate-950">
                  {supplier.company}
                </div>
                <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div>Contact: {supplier.contactName}</div>
                  <div>Phone: {supplier.phone}</div>
                  <div>Email: {supplier.email}</div>
                  <div>Address: {supplier.address}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
