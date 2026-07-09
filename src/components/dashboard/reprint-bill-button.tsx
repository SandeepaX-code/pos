"use client";

import { Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Order, PaymentMethod } from "@/types/domain";

export function ReprintBillButton({
  order,
  paymentMethod = "cash" as PaymentMethod,
}: {
  order: Order;
  paymentMethod?: PaymentMethod;
}) {
  async function onPrint() {
    try {
      const res = await fetch("/api/printer/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "customer",
          paymentMethod,
          order,
        }),
      });

      if (!res.ok) {
        toast.error("Print failed.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${order.orderNumber}-customer-receipt.bin`;
      anchor.click();
      URL.revokeObjectURL(url);

      toast.success("Customer receipt downloaded.");
    } catch {
      toast.error("Print error.");
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => void onPrint()}
      className="gap-2"
    >
      <Printer className="h-4 w-4" />
      Print
    </Button>
  );
}
