"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ApiTable = {
  _id: string;
  label: string;
  seats: number;
  zone: string;
  status: string;
  billId?: string;
};

const statusStyles: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700",
  occupied: "bg-rose-50 text-rose-700",
  reserved: "bg-orange-50 text-orange-700",
  cleaning: "bg-slate-100 text-slate-700",
  merged: "bg-violet-50 text-violet-700",
  split: "bg-cyan-50 text-cyan-700",
};

export default function TablesPage() {
  const [tables, setTables] = useState<ApiTable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTables() {
      try {
        const res = await fetch("/api/tables");
        if (res.ok) {
          const json = await res.json();
          const items = json.data?.items ?? (Array.isArray(json.data) ? json.data : []);
          setTables(items);
        }
      } catch (err) {
        console.error("Failed to load tables:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTables();
  }, []);

  return (
    <AppShell>
      <main className="space-y-6">
        <PageHeader
          eyebrow="Table Management"
          title="Visual restaurant floor plan"
          description="Monitor availability, reservations, cleaning, split, and merged states with color-coded table cards optimized for touch screens."
        />

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-2 text-sm text-slate-500">Loading tables layout...</span>
          </div>
        ) : tables.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {tables.map((table) => (
              <Card key={table._id} className="overflow-hidden">
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {table.zone || "Main Hall"}
                      </div>
                      <div className="mt-1 text-3xl font-semibold text-slate-950">
                        {table.label}
                      </div>
                    </div>
                    <Badge className={statusStyles[table.status] || "bg-slate-100 text-slate-700"}>
                      {table.status}
                    </Badge>
                  </div>
                  <div className="rounded-[22px] bg-gradient-to-br from-orange-100 to-orange-50 p-6 text-center text-xl font-semibold text-slate-950">
                    {table.seats} seats
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Table ID</span>
                    <span className="font-mono text-xs">{table._id}</span>
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
        ) : (
          <div className="py-12 text-center text-sm text-slate-500">
            No tables registered in the system.
          </div>
        )}
      </main>
    </AppShell>
  );
}
