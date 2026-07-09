import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  dashboardMetrics,
  monthlyRevenue,
  weeklyRevenue,
  yearlyRevenue,
} from "@/data/restaurant";

export default function ReportsPage() {
  return (
    <AppShell>
      <main className="space-y-6">
        <PageHeader
          eyebrow="Reports"
          title="Sales, profit, tax, and team performance"
          description="Operational reports for daily, weekly, monthly, and yearly review with export-ready totals for finance and management teams."
        />

        <div className="grid gap-4 xl:grid-cols-3">
          {dashboardMetrics.slice(0, 6).map((metric) => (
            <Card key={metric.label}>
              <CardContent>
                <div className="text-sm text-slate-500">{metric.label}</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "LKR",
                    maximumFractionDigits: 0,
                  }).format(metric.value)}
                </div>
                <Badge className="mt-3">{metric.delta}%</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[22px] bg-orange-50 p-4">
                  <div className="text-sm text-slate-500">Weekly revenue</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-950">
                    {weeklyRevenue
                      .reduce((sum, value) => sum + value, 0)
                      .toLocaleString()}
                  </div>
                </div>
                <div className="rounded-[22px] bg-orange-50 p-4">
                  <div className="text-sm text-slate-500">Monthly revenue</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-950">
                    {monthlyRevenue
                      .reduce((sum, value) => sum + value, 0)
                      .toLocaleString()}
                  </div>
                </div>
                <div className="rounded-[22px] bg-orange-50 p-4">
                  <div className="text-sm text-slate-500">Yearly revenue</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-950">
                    {yearlyRevenue
                      .reduce((sum, value) => sum + value, 0)
                      .toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <div className="text-lg font-semibold text-slate-950">
                Export options
              </div>
              <div className="rounded-[18px] border border-orange-100 bg-orange-50/70 p-4 text-sm text-slate-700">
                Excel, PDF, and CSV exports can be wired to server actions or
                route handlers.
              </div>
              <div className="rounded-[18px] border border-slate-100 bg-white p-4 text-sm text-slate-700 shadow-sm">
                Tax report, employee report, kitchen report, and customer report
                are ready to connect to MongoDB-backed analytics.
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
