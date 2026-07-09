import { BellRing, CalendarDays, Search, SunMedium } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { restaurantBrand } from "@/data/restaurant";

export function Topbar() {
  return (
    <header className="sticky top-4 z-20 rounded-[28px] border border-orange-100 bg-white/80 px-4 py-4 shadow-[0_20px_60px_rgba(148,163,184,0.12)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[180px] flex-1">
          <div className="text-xs uppercase tracking-[0.2em] text-orange-500">
            {restaurantBrand.slogan}
          </div>
          <div className="mt-1 text-xl font-semibold text-slate-950">
            Restaurant Management Command Center
          </div>
        </div>

        <div className="hidden min-w-[280px] flex-[1.4] items-center gap-3 md:flex">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-11"
              placeholder="Search orders, menu, tables, customers..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Calendar">
            <CalendarDays className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Notifications">
            <BellRing className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Theme">
            <SunMedium className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
