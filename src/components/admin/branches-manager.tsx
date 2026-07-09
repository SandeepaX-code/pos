"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PencilLine, Trash2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { branchUpsertSchema } from "@/validation/admin";

type BranchFormInput = z.input<typeof branchUpsertSchema>;

type SerializableBranch = {
  _id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  active: boolean;
  taxRate: number;
  serviceChargeRate: number;
  currencyCode: string;
};

const blankValues: BranchFormInput = {
  name: "",
  code: "",
  city: "",
  address: "",
  phone: "",
  email: "",
  active: true,
  taxRate: 0.08,
  serviceChargeRate: 0.05,
  currencyCode: "LKR",
};

export function BranchesManager({
  branches,
}: {
  branches: SerializableBranch[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const form = useForm<BranchFormInput>({
    resolver: zodResolver(branchUpsertSchema),
    defaultValues: blankValues,
  });

  useEffect(() => {
    const current = branches.find((branch) => branch._id === selectedId);
    if (current) {
      form.reset({
        name: current.name,
        code: current.code,
        city: current.city,
        address: current.address,
        phone: current.phone,
        email: current.email,
        active: current.active,
        taxRate: current.taxRate,
        serviceChargeRate: current.serviceChargeRate,
        currencyCode: current.currencyCode,
      });
    } else {
      form.reset(blankValues);
    }
  }, [branches, form, selectedId]);

  const onSubmit = async (values: BranchFormInput) => {
    const response = await fetch(
      selectedId ? `/api/admin/branches/${selectedId}` : "/api/admin/branches",
      {
        method: selectedId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      },
    );

    if (!response.ok) {
      toast.error("Branch save failed.");
      return;
    }

    toast.success(selectedId ? "Branch updated." : "Branch created.");
    setSelectedId(null);
    form.reset(blankValues);
    router.refresh();
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Delete this branch?")) {
      return;
    }

    const response = await fetch(`/api/admin/branches/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      toast.error("Branch delete failed.");
      return;
    }

    if (selectedId === id) {
      setSelectedId(null);
    }

    toast.success("Branch deleted.");
    router.refresh();
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{selectedId ? "Edit Branch" : "Create Branch"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <Input placeholder="Branch name" {...form.register("name")} />
            <Input placeholder="Code" {...form.register("code")} />
            <Input placeholder="City" {...form.register("city")} />
            <Input placeholder="Address" {...form.register("address")} />
            <Input placeholder="Phone" {...form.register("phone")} />
            <Input
              placeholder="Email"
              type="email"
              {...form.register("email")}
            />
            <div className="grid grid-cols-3 gap-3">
              <Input
                type="number"
                step="0.01"
                placeholder="Tax rate"
                {...form.register("taxRate", { valueAsNumber: true })}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Service charge"
                {...form.register("serviceChargeRate", { valueAsNumber: true })}
              />
              <Input
                placeholder="Currency"
                {...form.register("currencyCode")}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" {...form.register("active")} /> Active
            </label>
            <Button type="submit">
              {selectedId ? "Update Branch" : "Create Branch"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branches</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {branches.map((branch) => (
            <div
              key={branch._id}
              className="rounded-[20px] border border-orange-100 bg-orange-50/50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-950">
                    {branch.name}
                  </div>
                  <div className="text-sm text-slate-500">
                    {branch.code} · {branch.city}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedId(branch._id)}
                  >
                    <PencilLine className="h-4 w-4" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void onDelete(branch._id)}
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
