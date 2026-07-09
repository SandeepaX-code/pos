import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { PosWorkspace } from "@/components/pos/pos-workspace";

export default function DineInPage() {
  return (
    <AppShell>
      <main className="space-y-6">
        <PageHeader
          eyebrow="Dine-in POS"
          title="Table-aware ordering"
          description="Place dine-in orders tied to a table and print dine-in receipts + kitchen tickets."
        />
        <PosWorkspace mode="dine-in" />
      </main>
    </AppShell>
  );
}
