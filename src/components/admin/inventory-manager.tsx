"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PencilLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  adminInventoryAdjustmentSchema,
  inventoryItemUpsertSchema,
} from "@/validation/admin";

type InventoryItemFormInput = z.input<typeof inventoryItemUpsertSchema>;
type InventoryAdjustmentFormInput = z.input<
  typeof adminInventoryAdjustmentSchema
>;

type SerializableProduct = { _id: string; name: string };
type SerializableBranch = { _id: string; name: string; code: string };
type SerializableInventory = {
  _id: string;
  productId: string;
  name: string;
  unit: string;
  stockOnHand: number;
  stockReserved: number;
  reorderLevel: number;
  expiryDate?: string;
  barcode?: string;
  autoDeduct: boolean;
};

const itemDefaults: InventoryItemFormInput = {
  productId: "",
  branchId: "",
  name: "",
  unit: "",
  stockOnHand: 0,
  stockReserved: 0,
  reorderLevel: 0,
  expiryDate: undefined,
  barcode: undefined,
  lastCountedAt: undefined,
  autoDeduct: true,
};

const adjustmentDefaults: InventoryAdjustmentFormInput = {
  inventoryId: "",
  branchId: "",
  productId: "",
  createdBy: "",
  type: "adjustment",
  quantity: 1,
  reason: "",
  referenceType: undefined,
  referenceId: undefined,
};

export function InventoryManager({
  inventory,
  products,
  branches,
}: {
  inventory: SerializableInventory[];
  products: SerializableProduct[];
  branches: SerializableBranch[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const form = useForm<InventoryItemFormInput>({
    resolver: zodResolver(inventoryItemUpsertSchema),
    defaultValues: itemDefaults,
  });

  const adjustmentForm = useForm<InventoryAdjustmentFormInput>({
    resolver: zodResolver(adminInventoryAdjustmentSchema),
    defaultValues: adjustmentDefaults,
  });

  useEffect(() => {
    const current = inventory.find((item) => item._id === selectedId);
    if (current) {
      form.reset({
        productId: current.productId,
        branchId: branches[0]?._id ?? "",
        name: current.name,
        unit: current.unit,
        stockOnHand: current.stockOnHand,
        stockReserved: current.stockReserved,
        reorderLevel: current.reorderLevel,
        expiryDate: current.expiryDate,
        barcode: current.barcode,
        lastCountedAt: undefined,
        autoDeduct: current.autoDeduct,
      });
    } else {
      form.reset(itemDefaults);
    }
  }, [branches, form, inventory, selectedId]);

  const submitItem = async (values: InventoryItemFormInput) => {
    const response = await fetch(
      selectedId
        ? `/api/admin/inventory/${selectedId}`
        : "/api/admin/inventory",
      {
        method: selectedId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      },
    );

    if (!response.ok) {
      toast.error("Inventory item save failed.");
      return;
    }

    toast.success(
      selectedId ? "Inventory item updated." : "Inventory item created.",
    );
    setSelectedId(null);
    form.reset(itemDefaults);
    router.refresh();
  };

  const deleteItem = async (id: string) => {
    const response = await fetch(`/api/admin/inventory/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      toast.error("Inventory item delete failed.");
      return;
    }

    if (selectedId === id) {
      setSelectedId(null);
    }

    router.refresh();
  };

  const submitAdjustment = async (values: InventoryAdjustmentFormInput) => {
    const response = await fetch("/api/admin/inventory/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      toast.error("Inventory adjustment failed.");
      return;
    }

    toast.success("Inventory adjusted.");
    adjustmentForm.reset(adjustmentDefaults);
    router.refresh();
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedId ? "Edit Inventory Item" : "Create Inventory Item"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-4" onSubmit={form.handleSubmit(submitItem)}>
            <select
              className="h-11 rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none"
              {...form.register("productId")}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none"
              {...form.register("branchId")}
            >
              <option value="">Select branch</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name} ({branch.code})
                </option>
              ))}
            </select>
            <Input placeholder="Item name" {...form.register("name")} />
            <Input placeholder="Unit" {...form.register("unit")} />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Stock on hand"
                {...form.register("stockOnHand", { valueAsNumber: true })}
              />
              <Input
                type="number"
                placeholder="Reserved"
                {...form.register("stockReserved", { valueAsNumber: true })}
              />
              <Input
                type="number"
                placeholder="Reorder level"
                {...form.register("reorderLevel", { valueAsNumber: true })}
              />
              <Input type="date" {...form.register("expiryDate" as never)} />
            </div>
            <Input placeholder="Barcode" {...form.register("barcode")} />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" {...form.register("autoDeduct")} /> Auto
              deduct
            </label>
            <Button type="submit">
              {selectedId ? "Update Item" : "Create Item"}
            </Button>
          </form>

          <form
            className="mt-6 grid gap-4 rounded-[24px] border border-orange-100 bg-orange-50/40 p-4"
            onSubmit={adjustmentForm.handleSubmit(submitAdjustment)}
          >
            <div className="text-lg font-semibold text-slate-950">
              Inventory Adjustment
            </div>
            <select
              className="h-11 rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none"
              {...adjustmentForm.register("inventoryId")}
            >
              <option value="">Select item</option>
              {inventory.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none"
              {...adjustmentForm.register("branchId")}
            >
              <option value="">Select branch</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <select
              className="h-11 rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none"
              {...adjustmentForm.register("productId")}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="Created by user id"
              {...adjustmentForm.register("createdBy")}
            />
            <select
              className="h-11 rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none"
              {...adjustmentForm.register("type")}
            >
              <option value="adjustment">Adjustment</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="waste">Waste</option>
            </select>
            <Input
              type="number"
              placeholder="Quantity"
              {...adjustmentForm.register("quantity", { valueAsNumber: true })}
            />
            <Input
              placeholder="Reason"
              {...adjustmentForm.register("reason")}
            />
            <Button type="submit">Apply Adjustment</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {inventory.map((item) => (
            <div
              key={item._id}
              className="rounded-[20px] border border-orange-100 bg-orange-50/50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-950">
                    {item.name}
                  </div>
                  <div className="text-sm text-slate-500">
                    {item.unit} · {item.stockOnHand} on hand
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedId(item._id)}
                  >
                    <PencilLine className="h-4 w-4" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void deleteItem(item._id)}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
