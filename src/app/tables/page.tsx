import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { tables } from "@/data/restaurant";

const statusStyles: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700",
  occupied: "bg-rose-50 text-rose-700",
  reserved: "bg-orange-50 text-orange-700",
  cleaning: "bg-slate-100 text-slate-700",
  merged: "bg-violet-50 text-violet-700",
  split: "bg-cyan-50 text-cyan-700",
};

export default function TablesPage() {
  return (
    <AppShell>
      <main className="space-y-6">
        <PageHeader
          eyebrow="Table Management"
          title="Visual restaurant floor plan"
          description="Monitor availability, reservations, cleaning, split, and merged states with color-coded table cards optimized for touch screens."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {tables.map((table) => (
            <Card key={table.id} className="overflow-hidden">
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      {table.zone}
                    </div>
                    <div className="mt-1 text-3xl font-semibold text-slate-950">
                      {table.label}
                    </div>
                  </div>
                  <Badge className={statusStyles[table.status]}>
                    {table.status}
                  </Badge>
                </div>
                <div className="rounded-[22px] bg-gradient-to-br from-orange-100 to-orange-50 p-6 text-center text-xl font-semibold text-slate-950">
                  {table.seats} seats
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Table ID</span>
                  <span>{table.id}</span>
                </div>
                {table.billId ? (
                  <div className="rounded-[18px] border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-slate-700">
                    Active bill {table.billId}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
