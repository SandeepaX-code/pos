import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { notifications } from "@/data/restaurant";

export default function NotificationsPage() {
  return (
    <AppShell>
      <main className="space-y-6">
        <PageHeader
          eyebrow="Notifications"
          title="Operational alerts and system events"
          description="Low stock, new orders, printer offline, payment completion, and kitchen readiness alerts in one place."
        />

        <div className="grid gap-4 xl:grid-cols-2">
          {notifications.map((notification) => (
            <Card key={notification.id}>
              <CardContent>
                <div className="text-lg font-semibold text-slate-950">
                  {notification.title}
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-600">
                  {notification.message}
                </div>
                <div className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">
                  {notification.type}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
