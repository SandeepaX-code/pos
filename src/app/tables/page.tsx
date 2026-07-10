"use client";

import { useEffect, useState } from "react";
import { Loader2, DollarSign, Printer, CreditCard, QrCode } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ApiTable = {
  id: string;
  tableName: string;
  capacity: number;
  section: string;
  status: string;
  billId?: string;
  currentOrderId?: string;
};

const statusStyles: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700",
  occupied: "bg-rose-50 text-rose-700",
  reserved: "bg-orange-50 text-orange-700",
  cleaning: "bg-slate-100 text-slate-700",
  merged: "bg-violet-50 text-violet-700",
  split: "bg-cyan-50 text-cyan-700",
};

export default function TablesPage() {
  const { data: session } = useSession();
  const [tables, setTables] = useState<ApiTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableOrders, setTableOrders] = useState<Record<string, any>>({});
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<Record<string, "cash" | "card" | "qr">>({});
  const [processingTables, setProcessingTables] = useState<Record<string, boolean>>({});

  const fetchTablesAndOrders = async () => {
    try {
      const res = await fetch("/api/tables");
      if (res.ok) {
        const json = await res.json();
        const items = json.data?.items ?? (Array.isArray(json.data) ? json.data : []);
        setTables(items);

        // Fetch active orders for occupied tables
        const ordersMap: Record<string, any> = {};
        await Promise.all(
          items.map(async (table: ApiTable) => {
            if (table.currentOrderId) {
              try {
                const orderRes = await fetch(`/api/orders/${table.currentOrderId}`);
                if (orderRes.ok) {
                  const orderJson = await orderRes.json();
                  if (orderJson.success && orderJson.data) {
                    ordersMap[table.id] = orderJson.data;
                  }
                }
              } catch (e) {
                console.error(`Failed to fetch order for table ${table.id}:`, e);
              }
            }
          })
        );
        setTableOrders(ordersMap);
      }
    } catch (err) {
      console.error("Failed to load tables:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTablesAndOrders();
  }, []);

  const handlePayAndClose = async (table: ApiTable) => {
    const order = tableOrders[table.id];
    if (!order) return;

    const method = selectedPaymentMethods[table.id] || "cash";
    if (!confirm(`Confirm payment of ${order.grandTotal} LKR using ${method.toUpperCase()} and close table ${table.tableName}?`)) {
      return;
    }

    setProcessingTables(prev => ({ ...prev, [table.id]: true }));

    try {
      const payload = {
        branchId: order.branchId,
        tableId: table.id,
        tableLabel: table.tableName,
        waiterId: order.waiterId || session?.user?.id || "6a4ffaebd06eee4394e4aace",
        waiterName: order.waiterName || session?.user?.name || "cashier",
        cashierId: session?.user?.id,
        paymentMethod: method,
        items: order.items.map((i: any) => ({
          productId: String(i.productId),
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
        discount: order.discount || 0,
        notes: "Settled and closed from Table Overview panel",
        source: "dine-in",
        priority: "normal",
        printCustomerReceipt: false,
        printKitchenTicket: false,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`Table ${table.tableName} has been billed and closed successfully.`);
        // Reload all data
        await fetchTablesAndOrders();
      } else {
        const errJson = await res.json().catch(() => null);
        toast.error(errJson?.message || "Failed to close table.");
      }
    } catch (e) {
      toast.error("Failed to close table due to network error.");
    } finally {
      setProcessingTables(prev => ({ ...prev, [table.id]: false }));
    }
  };

  return (
    <AppShell>
      <main className="space-y-6">
        <PageHeader
          eyebrow="Table Management"
          title="Visual restaurant floor plan"
          description="Monitor availability, reservations, cleaning, split, and merged states with color-coded table cards optimized for touch screens."
        />

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-2 text-sm text-slate-500">Loading tables layout...</span>
          </div>
        ) : tables.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {tables.map((table) => {
              const statusKey = (table.status || "available").toLowerCase();
              const order = tableOrders[table.id];
              const selectedMethod = selectedPaymentMethods[table.id] || "cash";
              const isProcessing = processingTables[table.id] || false;

              return (
                <Card key={table.id} className="overflow-hidden border-orange-100 flex flex-col justify-between">
                  <CardContent className="space-y-4 pt-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            {table.section || "Main Hall"}
                          </div>
                          <div className="mt-1 text-3xl font-semibold text-slate-950">
                            {table.tableName}
                          </div>
                        </div>
                        <Badge className={statusStyles[statusKey] || "bg-slate-100 text-slate-700"}>
                          {statusKey}
                        </Badge>
                      </div>

                      <div className="rounded-[22px] bg-gradient-to-br from-orange-100 to-orange-50 p-4 text-center text-lg font-semibold text-slate-950">
                        {table.capacity} seats
                      </div>

                      {/* Display products one by one if occupied */}
                      {order && order.items && order.items.length > 0 ? (
                        <div className="space-y-2 border-t border-slate-100 pt-4">
                          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ordered Products:</div>
                          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                            {order.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-sm text-slate-700">
                                <span className="truncate max-w-[150px]">{item.name}</span>
                                <span className="font-medium">x{item.quantity} <span className="text-xs text-slate-400">({item.price * item.quantity} LKR)</span></span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center border-t border-dashed border-slate-200 pt-2 font-semibold text-slate-900 text-base">
                            <span>Grand Total:</span>
                            <span className="text-orange-600">{order.grandTotal} LKR</span>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      {order ? (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Method:</div>
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              type="button"
                              variant={selectedMethod === "cash" ? "default" : "outline"}
                              className="h-8 px-2 text-xs flex gap-1 items-center"
                              onClick={() => setSelectedPaymentMethods(prev => ({ ...prev, [table.id]: "cash" }))}
                            >
                              <DollarSign className="h-3 w-3" /> Cash
                            </Button>
                            <Button
                              type="button"
                              variant={selectedMethod === "card" ? "default" : "outline"}
                              className="h-8 px-2 text-xs flex gap-1 items-center"
                              onClick={() => setSelectedPaymentMethods(prev => ({ ...prev, [table.id]: "card" }))}
                            >
                              <CreditCard className="h-3 w-3" /> Card
                            </Button>
                            <Button
                              type="button"
                              variant={selectedMethod === "qr" ? "default" : "outline"}
                              className="h-8 px-2 text-xs flex gap-1 items-center"
                              onClick={() => setSelectedPaymentMethods(prev => ({ ...prev, [table.id]: "qr" }))}
                            >
                              <QrCode className="h-3 w-3" /> QR
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="default"
                            className="w-full mt-2 bg-rose-600 hover:bg-rose-700 text-white flex gap-1.5 items-center justify-center font-medium"
                            onClick={() => void handlePayAndClose(table)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                            Pay & Close Table
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-sm text-slate-400">
                          <span>Table ID</span>
                          <span className="font-mono text-xs">{table.id}</span>
                        </div>
                      )}

                      {table.billId && !order ? (
                        <div className="rounded-[18px] border border-orange-100 bg-orange-50 px-4 py-2 text-xs text-slate-700">
                          Active bill: {table.billId}
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-slate-500">
            No tables registered in the system.
          </div>
        )}
      </main>
    </AppShell>
  );
}
