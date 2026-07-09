"use client";

import { useMemo } from "react";

import { useSession } from "next-auth/react";

import { toast } from "sonner";

import type { Order } from "@/types/domain";
import { ReprintBillButton } from "@/components/dashboard/reprint-bill-button";

const PRINT_PERMISSION = "orders.checkout";

export function PermissionGatedReprint({
  order,
  paymentMethod,
}: {
  order: Order;
  paymentMethod: "cash" | "card" | "qr" | "mixed";
}) {
  const { data: session } = useSession();

  const canPrint = useMemo(() => {
    const permissions = (session?.user as { permissions?: string[] })
      ?.permissions;

    if (!permissions) return false;
    return permissions.includes(PRINT_PERMISSION);
  }, [session?.user]);

  if (!canPrint) {
    return (
      <button
        type="button"
        className="rounded-md border px-3 py-2 text-xs text-slate-500"
        onClick={() => toast.error("No permission to print bills.")}
      >
        Print
      </button>
    );
  }

  return <ReprintBillButton order={order} paymentMethod={paymentMethod} />;
}
