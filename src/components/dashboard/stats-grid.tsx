import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { dashboardMetrics } from "@/data/restaurant";

export function StatsGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {dashboardMetrics.map((metric) => {
        const positive = metric.delta >= 0;

        return (
          <Card key={metric.label} className="relative overflow-hidden p-5">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {metric.label}
                </p>
                <div className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-slate-950">
                  {metric.label.toLowerCase().includes("sales") ||
                  metric.label === "Revenue" ||
                  metric.label === "Expenses" ||
                  metric.label === "Profit"
                    ? new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "LKR",
                        maximumFractionDigits: 0,
                      }).format(metric.value)
                    : new Intl.NumberFormat("en-US").format(metric.value)}
                </div>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${positive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
              >
                {positive ? (
                  <ArrowUpRight className="h-5 w-5" />
                ) : (
                  <ArrowDownRight className="h-5 w-5" />
                )}
              </div>
            </div>
            <div
              className={`mt-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
            >
              {positive ? "+" : ""}
              {metric.delta}% vs last period
            </div>
            <div className="pointer-events-none absolute -bottom-12 -right-8 h-28 w-28 rounded-full bg-orange-100/60 blur-2xl" />
          </Card>
        );
      })}
    </div>
  );
}
