"use client";

import {
  Bell,
  ChefHat,
  Grid2x2,
  HeartPulse,
  LayoutDashboard,
  LogIn,
  LogOut,
  Package,
  Printer,
  ScrollText,
  Table2,
  Users,
  UtensilsCrossed,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { restaurantBrand } from "@/data/restaurant";
import { userHasPermission } from "@/lib/permissions";

const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, permission: "dashboard.view" },
  { label: "Dine-in", href: "/pos/dine-in", icon: Grid2x2, featured: true, permission: "orders.create" },
  { label: "Takeaway", href: "/pos/takeaway", icon: UtensilsCrossed, permission: "orders.create" },
  { label: "Kitchen", href: "/kitchen", icon: ChefHat, permission: "kitchen.view" },
  { label: "Tables", href: "/tables", icon: Table2, permission: "tables.view" },
  { label: "Inventory", href: "/inventory", icon: Warehouse, permission: "inventory.view" },
  { label: "Reports", href: "/reports", icon: ScrollText, permission: "reports.view" },
  { label: "Customers", href: "/customers", icon: Users, permission: "customers.manage" },
  { label: "Suppliers", href: "/suppliers", icon: Package, permission: "suppliers.manage" },
  { label: "Printers", href: "/printers", icon: Printer, permission: "printers.manage" },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: HeartPulse, permission: "settings.manage" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const filteredNavigation = navigation.filter((item) => {
    if (!item.permission) return true;
    if (status !== "authenticated" || !session?.user) return false;
    return userHasPermission(
      session.user.role,
      session.user.permissions ?? [],
      item.permission,
    );
  });

  return (
    <aside className="flex h-full flex-col gap-6 p-5">
      <div className="rounded-[28px] bg-[linear-gradient(135deg,_#0f172a_0%,_#111827_58%,_#1f2937_100%)] p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/25">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-semibold">{restaurantBrand.name}</div>
            <div className="text-xs text-slate-300">Restaurant ERP</div>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-300">
            Active branch
          </div>
          <div className="mt-2 text-sm font-semibold">Central Colombo</div>
          <Badge className="mt-3 border-orange-300 bg-orange-500/15 text-orange-200">
            Production Ready
          </Badge>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : item.featured
                  ? "bg-orange-50 text-orange-700 shadow-sm hover:bg-orange-100/70"
                  : "text-slate-700 hover:bg-orange-50 hover:text-orange-700"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {status === "authenticated" ? (
        <div className="rounded-[24px] border border-orange-100 bg-orange-50 p-4">
          <div className="text-sm font-semibold text-slate-950">Quick action</div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-medium text-slate-700 truncate max-w-[200px]">
              {session.user?.name || "Active Staff"}
            </p>
          </div>
          <p className="text-[10px] text-slate-400 capitalize mt-0.5">
            Role: {session.user?.role || "user"}
          </p>
          <Button
            className="mt-4 w-full border-orange-200 bg-white text-orange-700 hover:bg-orange-100/50 hover:text-orange-800"
            variant="outline"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      ) : (
        <div className="rounded-[24px] border border-orange-100 bg-orange-50 p-4">
          <div className="text-sm font-semibold text-slate-950">Quick action</div>
          <p className="mt-1 text-sm text-slate-600">
            Sign in to access live orders, table control, and checkout flows.
          </p>
          <Link href="/login" className="block mt-4">
            <Button className="w-full" variant="default">
              <LogIn className="h-4 w-4" />
              Secure Login
            </Button>
          </Link>
        </div>
      )}
    </aside>
  );
}
