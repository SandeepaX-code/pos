"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PencilLine, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminUserFormSchema } from "@/validation/admin";
import { z } from "zod";

type AdminUserFormInput = z.input<typeof adminUserFormSchema>;

type SerializableBranch = { _id: string; name: string; code: string };
type SerializableUser = {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  branchId: string;
  active: boolean;
};

const blankValues: AdminUserFormInput = {
  fullName: "",
  username: "",
  email: "",
  phone: "",
  role: "cashier",
  branchId: "",
  password: "",
  active: true,
  avatar: undefined,
};

export function UsersManager({
  users,
  branches,
}: {
  users: SerializableUser[];
  branches: SerializableBranch[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const form = useForm<AdminUserFormInput>({
    resolver: zodResolver(adminUserFormSchema),
    defaultValues: blankValues,
  });

  useEffect(() => {
    const current = users.find((user) => user._id === selectedId);
    if (current) {
      form.reset({
        fullName: current.fullName,
        username: current.username,
        email: current.email,
        phone: current.phone,
        role: current.role as AdminUserFormInput["role"],
        branchId: current.branchId,
        password: "",
        active: current.active,
        avatar: undefined,
      });
    } else {
      form.reset(blankValues);
    }
  }, [form, selectedId, users]);

  const onSubmit = async (values: AdminUserFormInput) => {
    if (!selectedId && !values.password) {
      toast.error("Password is required when creating a user.");
      return;
    }

    const payload = { ...values } as Record<string, unknown>;

    if (selectedId && !payload.password) {
      delete payload.password;
    }

    const response = await fetch(
      selectedId ? `/api/admin/users/${selectedId}` : "/api/admin/users",
      {
        method: selectedId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      toast.error("User save failed.");
      return;
    }

    toast.success(selectedId ? "User updated." : "User created.");
    setSelectedId(null);
    form.reset(blankValues);
    router.refresh();
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Delete this user?")) {
      return;
    }

    const response = await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      toast.error("User delete failed.");
      return;
    }

    if (selectedId === id) {
      setSelectedId(null);
    }

    toast.success("User deleted.");
    router.refresh();
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{selectedId ? "Edit User" : "Create User"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <Input placeholder="Full name" {...form.register("fullName")} />
            <Input placeholder="Username" {...form.register("username")} />
            <Input
              placeholder="Email"
              type="email"
              {...form.register("email")}
            />
            <Input placeholder="Phone" {...form.register("phone")} />
            <select
              className="h-11 rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none"
              {...form.register("role")}
            >
              <option value="superAdmin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="cashier">Cashier</option>
              <option value="waiter">Waiter</option>
              <option value="kitchenStaff">Kitchen Staff</option>
              <option value="inventoryManager">Inventory Manager</option>
              <option value="accountant">Accountant</option>
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
            <Input
              placeholder={selectedId ? "New password (optional)" : "Password"}
              type="password"
              {...form.register("password")}
            />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" {...form.register("active")} /> Active
            </label>
            <Button type="submit">
              {selectedId ? "Update User" : "Create User"}
            </Button>
            {selectedId ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSelectedId(null)}
              >
                Cancel edit
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((user) => (
            <div
              key={user._id}
              className="rounded-[20px] border border-orange-100 bg-orange-50/50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-950">
                    {user.fullName}
                  </div>
                  <div className="text-sm text-slate-500">
                    {user.username} · {user.role}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedId(user._id)}
                  >
                    <PencilLine className="h-4 w-4" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void onDelete(user._id)}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-500">
                {user.email} · {user.phone}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
