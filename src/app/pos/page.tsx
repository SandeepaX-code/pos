import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { PosWorkspace } from "@/components/pos/pos-workspace";

export default function PosPage() {
  return (
    <AppShell>
      <main className="space-y-6">
        <PageHeader
          eyebrow="Point of Sale"
          title="Touch-first POS terminal"
          description="Fast menu search, table-aware ordering, hold/resume, split and merge bill actions, and printer-backed checkout for the front of house."
        />
        <PosWorkspace mode="dine-in" />
      </main>
    </AppShell>
  );
}
