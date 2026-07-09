import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <AppShell>
      <main className="space-y-6">
        <PageHeader
          eyebrow="Settings"
          title="Restaurant configuration"
          description="Manage taxes, branches, printer settings, access controls, and system preferences from one workspace."
        />

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardContent className="space-y-3">
              <div className="text-lg font-semibold text-slate-950">
                Access control
              </div>
              <div className="text-sm leading-6 text-slate-600">
                Role-based permissions, session lifetime, and secure
                authentication can be tuned through environment-driven settings
                and MongoDB-managed users.
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3">
              <div className="text-lg font-semibold text-slate-950">
                Printer settings
              </div>
              <div className="text-sm leading-6 text-slate-600">
                Configure receipt and KOT printers, network endpoints, and
                ESC/POS bridge behavior for the checkout flow.
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
