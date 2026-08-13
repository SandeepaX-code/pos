import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { dashboardMetrics } from "@/data/restaurant";

export function StatsGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {dashboardMetrics.map((metric) => {
        const positive = metric.delta >= 0;

        return (
          <Card 
            key={metric.label} 
            className="relative overflow-hidden p-5 border border-orange-100/50 bg-white/95 shadow-[0_10px_30px_rgba(148,163,184,0.05)] hover:-translate-y-1.5 hover:shadow-[0_30px_60px_rgba(249,115,22,0.1)] hover:border-orange-300/40 transition-all duration-300 ease-out group"
          >
            {/* Left Vertical Gradient Strip */}
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-orange-500 via-orange-400 to-amber-300" />
            
            <div className="flex items-start justify-between gap-4 pl-1">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  {metric.label}
                </p>
                <div className="mt-2.5 font-[family-name:var(--font-display)] text-2.5xl font-bold tracking-tight text-slate-950">
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
                className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 shadow-sm ${
                  positive 
                    ? "bg-emerald-50/80 text-emerald-600 border border-emerald-100/30" 
                    : "bg-rose-50/80 text-rose-600 border border-rose-100/30"
                }`}
              >
                {positive ? (
                  <ArrowUpRight className="h-5 w-5" />
                ) : (
                  <ArrowDownRight className="h-5 w-5" />
                )}
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2 pl-1">
              <div
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  positive 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100/50" 
                    : "bg-rose-50 text-rose-700 border border-rose-100/50"
                }`}
              >
                {positive ? "↑" : "↓"} {Math.abs(metric.delta)}%
              </div>
              <span className="text-[10px] font-medium text-slate-400">vs last period</span>
            </div>
            
            {/* Glowing Decorative Backdrop Element */}
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-orange-100/30 blur-2xl group-hover:bg-orange-200/40 transition-colors duration-500" />
          </Card>
        );
      })}
    </div>
  );
}
