"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Grid2x2,
  Table2,
  ChefHat,
  Menu,
  X,
  Warehouse,
  ScrollText,
  Users,
  Package,
  Printer,
  Bell,
  HeartPulse,
  LogOut,
  UtensilsCrossed,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { userHasPermission } from "@/lib/permissions";

interface NavItem {
  label: string;
  href: string;
  icon: any;
  permission?: string;
  superAdminOnly?: boolean;
}

const primaryNav: NavItem[] = [
  { label: "Home", href: "/", icon: LayoutDashboard, permission: "dashboard.view" },
  { label: "Dine-in", href: "/pos/dine-in", icon: Grid2x2, permission: "orders.create" },
  { label: "Tables", href: "/tables", icon: Table2, permission: "tables.view" },
  { label: "Kitchen", href: "/kitchen", icon: ChefHat, permission: "kitchen.view" },
];

const secondaryNav: NavItem[] = [
  { label: "Takeaway", href: "/pos/takeaway", icon: UtensilsCrossed, permission: "orders.create" },
  { label: "Inventory", href: "/inventory", icon: Warehouse, permission: "inventory.view" },
  { label: "Reports", href: "/reports", icon: ScrollText, permission: "reports.view" },
  { label: "Customers", href: "/customers", icon: Users, permission: "customers.manage" },
  { label: "Suppliers", href: "/suppliers", icon: Package, permission: "suppliers.manage" },
  { label: "Printers", href: "/printers", icon: Printer, permission: "printers.manage" },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: HeartPulse, permission: "settings.manage" },
  { label: "Menu Editor", href: "/admin/menu", icon: UtensilsCrossed, superAdminOnly: true },
];

export function MobileNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (status !== "authenticated" || !session?.user) return null;

  const hasPermission = (item: NavItem) => {
    if (item.label === "Menu Editor" && session.user.role !== "superAdmin") return false;
    if (item.superAdminOnly && session.user.role !== "superAdmin") return false;
    if (!item.permission) return true;
    return userHasPermission(
      session.user.role,
      session.user.permissions ?? [],
      item.permission,
    );
  };

  const filteredPrimary = primaryNav.filter(hasPermission);
  const filteredSecondary = secondaryNav.filter(hasPermission);

  return (
    <div className="xl:hidden">
      {/* Floating Bottom Navigation Bar */}
      <nav className="fixed bottom-4 left-4 right-4 z-40 h-16 rounded-2xl border border-orange-100 bg-white/90 p-2 shadow-lg backdrop-blur-md flex items-center justify-around">
        {filteredPrimary.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl transition-all ${
                isActive
                  ? "text-orange-500 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[9px] tracking-wide">{item.label}</span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[9px] tracking-wide">More</span>
        </button>
      </nav>

      {/* Slide-Up Bottom Drawer Menu Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
          {/* Backdrop Click Dismiss */}
          <div className="absolute inset-0 -z-10" onClick={() => setIsOpen(false)} />

          {/* Drawer content */}
          <div className="bg-white rounded-t-[32px] border-t border-orange-100 p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between border-b border-orange-50 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  Navigation Menu
                </h3>
                <p className="text-xs text-slate-500">Access all restaurant workflows</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Menu Links */}
            <div className="grid grid-cols-2 gap-3">
              {filteredSecondary.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-xl p-3 border text-xs font-semibold transition ${
                      isActive
                        ? "border-orange-200 bg-orange-50 text-orange-700"
                        : "border-slate-100 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <item.icon className="h-4 w-4 text-orange-500" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Session Info & Logout */}
            <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {session.user?.name?.slice(0, 2).toUpperCase() || "US"}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-950">
                    {session.user?.name || "Active Staff"}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    Role: {session.user?.role || "user"} · Branch: Central Colombo
                  </div>
                </div>
              </div>
              <Button
                className="w-full h-11 bg-white hover:bg-rose-50 border-orange-200 text-rose-600 hover:text-rose-700 shadow-sm"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  signOut({ callbackUrl: "/login" });
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
