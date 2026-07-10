import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import { userHasPermission } from "@/lib/permissions";

import { AppShell } from "@/components/layout/app-shell";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const hasDashboardView = userHasPermission(
    session.user.role,
    session.user.permissions ?? [],
    "dashboard.view",
  );

  if (!hasDashboardView) {
    if (userHasPermission(session.user.role, session.user.permissions ?? [], "orders.create")) {
      redirect("/pos/dine-in");
    } else if (userHasPermission(session.user.role, session.user.permissions ?? [], "kitchen.view")) {
      redirect("/kitchen");
    } else if (userHasPermission(session.user.role, session.user.permissions ?? [], "inventory.view")) {
      redirect("/inventory");
    } else if (userHasPermission(session.user.role, session.user.permissions ?? [], "reports.view")) {
      redirect("/reports");
    } else {
      redirect("/login");
    }
  }

  const isCashier = session.user.role === "cashier";

  return (
    <AppShell>
      <main className="space-y-6">
        <section className="rounded-[28px] border border-orange-100 bg-[linear-gradient(135deg,_rgba(255,255,255,0.96)_0%,_rgba(255,248,241,0.94)_100%)] p-6 shadow-[0_20px_70px_rgba(148,163,184,0.14)] md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-4xl">
              <Badge>{isCashier ? "Cashier Operational Desk" : "Live operations overview"}</Badge>
              <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
                {isCashier
                  ? "Real-time order tracker and billing terminal overview."
                  : "Restaurant operations, POS, kitchen, inventory, and finance in one production-ready workspace."}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                {isCashier
                  ? "Monitor all recent orders, manage table settlements, and confirm dine-in or takeaway checks."
                  : "SYZYGY POS Suite gives super admins, managers, cashiers, waiters, kitchen staff, and accountants a shared operating system with role isolation, real-time order visibility, and printer-aware checkout."}
              </p>
            </div>
            <div className="grid gap-3 rounded-[24px] bg-slate-950 p-4 text-white shadow-[0_20px_60px_rgba(15,23,42,0.22)]">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Branch
              </div>
              <div className="text-lg font-semibold">Central Colombo</div>
              <div className="text-sm text-slate-300">
                8 tables active · 2 printers online
              </div>
              <Button className="mt-1" variant="default">
                Open POS Terminal
              </Button>
            </div>
          </div>
        </section>

        {!isCashier && <StatsGrid />}
        {!isCashier && <DashboardCharts />}
        <RecentOrders />
      </main>
    </AppShell>
  );
}
