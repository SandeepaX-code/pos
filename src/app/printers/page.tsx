import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function PrintersPage() {
  return (
    <AppShell>
      <main className="space-y-6">
        <PageHeader
          eyebrow="Printers"
          title="ESC/POS thermal printer bridge"
          description="Preview printer availability, network status, and receipt generation output for customer bills and kitchen tickets."
        />

        <Card>
          <CardContent className="space-y-3">
            <div className="text-lg font-semibold text-slate-950">
              Printer bridge
            </div>
            <div className="text-sm leading-6 text-slate-600">
              Checkout calls the receipt API to generate ESC/POS payloads. In
              production, wire the binary output to a local print bridge,
              network printer service, or kiosk agent.
            </div>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
