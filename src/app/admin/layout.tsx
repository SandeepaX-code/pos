import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";

const adminSections = ["Overview", "Users", "Branches", "Menu", "Inventory"];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <main className="space-y-6">
        <div className="rounded-[28px] border border-orange-100 bg-slate-950 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] md:p-8">
          <div className="inline-flex rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">
            Admin Console
          </div>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">
            Secure management workspace
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Role-protected screens for super admins and admins to manage users,
            branches, menu catalogues, and inventory operations.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {adminSections.map((section) => (
              <Badge
                key={section}
                className="border-white/10 bg-white/5 text-white"
              >
                {section}
              </Badge>
            ))}
          </div>
        </div>
        {children}
      </main>
    </AppShell>
  );
}
