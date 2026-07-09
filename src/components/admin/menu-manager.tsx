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
import { categoryUpsertSchema, productUpsertSchema } from "@/validation/admin";

type CategoryFormInput = z.input<typeof categoryUpsertSchema>;
type ProductFormInput = z.input<typeof productUpsertSchema>;

type SerializableCategory = {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
  color: string;
  active: boolean;
  sortOrder: number;
};

type SerializableProduct = {
  _id: string;
  name: string;
  sku: string;
  categoryId: string;
  image: string;
  price: number;
  cost: number;
  available: boolean;
  stock: number;
  lowStockThreshold: number;
  description?: string;
};

const categoryDefaults: CategoryFormInput = {
  name: "",
  slug: "",
  icon: "",
  image: "",
  color: "#f97316",
  active: true,
  sortOrder: 0,
};

const productDefaults: ProductFormInput = {
  name: "",
  sku: "",
  categoryId: "",
  image: "",
  price: 0,
  cost: 0,
  available: true,
  stock: 0,
  lowStockThreshold: 0,
  branchId: undefined,
  description: "",
};

export function MenuManager({
  categories,
  products,
}: {
  categories: SerializableCategory[];
  products: SerializableProduct[];
}) {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );

  const categoryForm = useForm<CategoryFormInput>({
    resolver: zodResolver(categoryUpsertSchema),
    defaultValues: categoryDefaults,
  });

  const productForm = useForm<ProductFormInput>({
    resolver: zodResolver(productUpsertSchema),
    defaultValues: productDefaults,
  });

  useEffect(() => {
    const current = categories.find(
      (category) => category._id === selectedCategoryId,
    );
    if (current) {
      categoryForm.reset({
        name: current.name,
        slug: current.slug,
        icon: current.icon,
        image: current.image,
        color: current.color,
        active: current.active,
        sortOrder: current.sortOrder,
      });
    } else {
      categoryForm.reset(categoryDefaults);
    }
  }, [categories, categoryForm, selectedCategoryId]);

  useEffect(() => {
    const current = products.find(
      (product) => product._id === selectedProductId,
    );
    if (current) {
      productForm.reset({
        name: current.name,
        sku: current.sku,
        categoryId: current.categoryId,
        image: current.image,
        price: current.price,
        cost: current.cost,
        available: current.available,
        stock: current.stock,
        lowStockThreshold: current.lowStockThreshold,
        branchId: undefined,
        description: current.description ?? "",
      });
    } else {
      productForm.reset(productDefaults);
    }
  }, [productForm, products, selectedProductId]);

  const categorySubmit = async (values: CategoryFormInput) => {
    const response = await fetch(
      selectedCategoryId
        ? `/api/admin/categories/${selectedCategoryId}`
        : "/api/admin/categories",
      {
        method: selectedCategoryId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      },
    );

    if (!response.ok) {
      toast.error("Category save failed.");
      return;
    }

    toast.success(
      selectedCategoryId ? "Category updated." : "Category created.",
    );
    setSelectedCategoryId(null);
    categoryForm.reset(categoryDefaults);
    router.refresh();
  };

  const productSubmit = async (values: ProductFormInput) => {
    const response = await fetch(
      selectedProductId
        ? `/api/admin/products/${selectedProductId}`
        : "/api/admin/products",
      {
        method: selectedProductId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      },
    );

    if (!response.ok) {
      toast.error("Product save failed.");
      return;
    }

    toast.success(selectedProductId ? "Product updated." : "Product created.");
    setSelectedProductId(null);
    productForm.reset(productDefaults);
    router.refresh();
  };

  const onDeleteCategory = async (id: string) => {
    const response = await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      toast.error("Category delete failed.");
      return;
    }

    if (selectedCategoryId === id) {
      setSelectedCategoryId(null);
    }

    router.refresh();
  };

  const onDeleteProduct = async (id: string) => {
    const response = await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      toast.error("Product delete failed.");
      return;
    }

    if (selectedProductId === id) {
      setSelectedProductId(null);
    }

    router.refresh();
  };

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedCategoryId ? "Edit Category" : "Create Category"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="grid gap-4"
            onSubmit={categoryForm.handleSubmit(categorySubmit)}
          >
            <Input placeholder="Name" {...categoryForm.register("name")} />
            <Input placeholder="Slug" {...categoryForm.register("slug")} />
            <Input placeholder="Icon" {...categoryForm.register("icon")} />
            <Input placeholder="Image" {...categoryForm.register("image")} />
            <Input placeholder="Color" {...categoryForm.register("color")} />
            <Input
              type="number"
              placeholder="Sort order"
              {...categoryForm.register("sortOrder", { valueAsNumber: true })}
            />
            <Button type="submit">
              {selectedCategoryId ? "Update Category" : "Create Category"}
            </Button>
          </form>
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category._id}
                className="flex items-center justify-between gap-2 rounded-[18px] border border-orange-100 bg-orange-50/50 p-3"
              >
                <div>
                  <div className="font-medium text-slate-950">
                    {category.name}
                  </div>
                  <div className="text-sm text-slate-500">{category.slug}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedCategoryId(category._id)}
                  >
                    <PencilLine className="h-4 w-4" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void onDeleteCategory(category._id)}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedProductId ? "Edit Product" : "Create Product"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="grid gap-4"
            onSubmit={productForm.handleSubmit(productSubmit)}
          >
            <Input placeholder="Name" {...productForm.register("name")} />
            <Input placeholder="SKU" {...productForm.register("sku")} />
            <select
              className="h-11 rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none"
              {...productForm.register("categoryId")}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Input placeholder="Image" {...productForm.register("image")} />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                step="0.01"
                placeholder="Price"
                {...productForm.register("price", { valueAsNumber: true })}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Cost"
                {...productForm.register("cost", { valueAsNumber: true })}
              />
              <Input
                type="number"
                placeholder="Stock"
                {...productForm.register("stock", { valueAsNumber: true })}
              />
              <Input
                type="number"
                placeholder="Low stock"
                {...productForm.register("lowStockThreshold", {
                  valueAsNumber: true,
                })}
              />
            </div>
            <Input
              placeholder="Description"
              {...productForm.register("description")}
            />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" {...productForm.register("available")} />{" "}
              Available
            </label>
            <Button type="submit">
              {selectedProductId ? "Update Product" : "Create Product"}
            </Button>
          </form>

          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product._id}
                className="flex items-center justify-between gap-2 rounded-[18px] border border-orange-100 bg-orange-50/50 p-3"
              >
                <div>
                  <div className="font-medium text-slate-950">
                    {product.name}
                  </div>
                  <div className="text-sm text-slate-500">
                    {product.sku} · {product.price}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedProductId(product._id)}
                  >
                    <PencilLine className="h-4 w-4" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void onDeleteProduct(product._id)}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
