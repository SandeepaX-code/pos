import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { PosWorkspace } from "@/components/pos/pos-workspace";

export default function TakeawayPage() {
  return (
    <AppShell>
      <main className="space-y-6">
        <PageHeader
          eyebrow="Takeaway POS"
          title="Fast takeaway checkout"
          description="Place takeaway orders (no table required) and print takeaway receipts + kitchen tickets."
        />
        <PosWorkspace mode="takeaway" />
      </main>
    </AppShell>
  );
}
