import Link from "next/link";
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
          <Link href="/admin/users" className="block transition-transform hover:scale-[1.01]">
            <Card className="cursor-pointer hover:border-orange-200 transition-colors h-full">
              <CardContent className="space-y-3">
                <div className="text-lg font-semibold text-slate-950 flex items-center gap-2">
                  Access control
                  <span className="text-xs font-normal text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full">
                    Configure
                  </span>
                </div>
                <div className="text-sm leading-6 text-slate-600">
                  Role-based permissions, session lifetime, and secure
                  authentication can be tuned through environment-driven settings
                  and MongoDB-managed users.
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/printers" className="block transition-transform hover:scale-[1.01]">
            <Card className="cursor-pointer hover:border-orange-200 transition-colors h-full">
              <CardContent className="space-y-3">
                <div className="text-lg font-semibold text-slate-950 flex items-center gap-2">
                  Printer settings
                  <span className="text-xs font-normal text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full">
                    Configure
                  </span>
                </div>
                <div className="text-sm leading-6 text-slate-600">
                  Configure receipt and KOT printers, network endpoints, and
                  ESC/POS bridge behavior for the checkout flow.
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
