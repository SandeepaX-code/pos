import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { ReportService } from "@/services/report-service";
import { ReportsWorkspace } from "@/components/reports/reports-workspace";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const service = new ReportService();

  // Default filter: past 30 days
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 30);
  const fromStr = fromDate.toISOString();
  const toStr = new Date().toISOString();

  // Fetch all live database analytical reports in parallel
  const [
    bestSellers,
    categoryPerformance,
    profitLoss,
    waiterPerformance,
    revenueBreakdown,
  ] = await Promise.all([
    service.getBestSellers(fromStr, toStr, 10),
    service.getCategoryPerformance(fromStr, toStr),
    service.getProfitAndLoss(fromStr, toStr),
    service.getWaiterPerformance(fromStr, toStr),
    service.getRevenueBreakdown(fromStr, toStr),
  ]);

  return (
    <AppShell>
      <main className="space-y-6">
        <PageHeader
          eyebrow="Tanderrum.Ai Analytics"
          title="Operational Reports Center"
          description="Interactive dashboards detailing gross margins, food items product mix, waiter sales generation, and tax compliance data."
        />

        <ReportsWorkspace
          bestSellers={bestSellers}
          categoryPerformance={categoryPerformance}
          profitLoss={profitLoss}
          waiterPerformance={waiterPerformance}
          revenueBreakdown={revenueBreakdown}
        />
      </main>
    </AppShell>
  );
}
