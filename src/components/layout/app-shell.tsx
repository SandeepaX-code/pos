import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1800px] gap-4 p-4 lg:p-6">
      <div className="hidden w-[300px] shrink-0 overflow-hidden rounded-[32px] border border-orange-100 bg-white/85 shadow-[0_30px_100px_rgba(222,143,46,0.12)] xl:block">
        <Sidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Topbar />
        <div className="rounded-[32px] border border-orange-100 bg-white/75 p-4 shadow-[0_20px_80px_rgba(148,163,184,0.12)] backdrop-blur-xl md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
