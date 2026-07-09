import { Types } from "mongoose";
import { type ProductDocument } from "@/models/product";
import { connectToDatabase } from "@/lib/mongoose";
import { ProductRepository } from "@/repositories/product-repository";
import { CategoryRepository } from "@/repositories/category-repository";

export type CategoryRef = {
  _id?: Types.ObjectId;
  name?: string;
};

export type ProductListQuery = {
  search?: string;
  categoryId?: string;
  available?: boolean;
  branchId?: string;
  sortBy?: "name" | "price" | "stock" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type ProductVariant = {
  label: string;
  price: number;
  cost: number;
};

export type ProductAddon = {
  label: string;
  price: number;
};

export type ProductListResult = {
  items: Array<{
    id: string;
    name: string;
    sku: string;
    categoryId: string;
    categoryName?: string;
    image: string;
    price: number;
    cost: number;
    available: boolean;
    stock: number;
    lowStockThreshold: number;
    variants: ProductVariant[];
    addons: ProductAddon[];
    branchId?: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ProductCreateInput = {
  name: string;
  sku: string;
  categoryId: string;
  image: string;
  price: number;
  cost: number;
  available?: boolean;
  stock?: number;
  lowStockThreshold?: number;
  branchId?: string;
  description?: string;
  variants?: ProductVariant[];
  addons?: ProductAddon[];
};

export type ProductUpdateInput = Partial<ProductCreateInput>;

type ProductLean = Partial<ProductDocument> & {
  _id?: Types.ObjectId;
  categoryId?: Types.ObjectId | CategoryRef;
  createdAt?: Date;
  updatedAt?: Date;
};

export class ProductService {
  private readonly products = new ProductRepository();
  private readonly categories = new CategoryRepository();

  private formatProduct(product: ProductLean) {
    let categoryId = "";
    let categoryName: string | undefined;

    if (product.categoryId instanceof Types.ObjectId) {
      categoryId = String(product.categoryId);
    } else if (
      typeof product.categoryId === "object" &&
      product.categoryId !== null
    ) {
      const catRef = product.categoryId as CategoryRef;
      categoryId = String(catRef._id);
      categoryName = catRef.name;
    }

    return {
      id: String(product._id),
      name: product.name || "",
      sku: product.sku || "",
      categoryId,
      categoryName,
      image: product.image || "",
      price: product.price ?? 0,
      cost: product.cost ?? 0,
      available: product.available ?? true,
      stock: product.stock ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 0,
      variants: product.variants || [],
      addons: product.addons || [],
      branchId: product.branchId ? String(product.branchId) : undefined,
      description: product.description ?? undefined,
      createdAt:
        product.createdAt instanceof Date
          ? product.createdAt.toISOString()
          : String(product.createdAt ?? ""),
      updatedAt:
        product.updatedAt instanceof Date
          ? product.updatedAt.toISOString()
          : String(product.updatedAt ?? ""),
    };
  }

  async list(query: ProductListQuery): Promise<ProductListResult> {
    await connectToDatabase();

    const {
      search,
      categoryId,
      available,
      branchId,
      sortBy = "name",
      sortOrder = "asc",
      page = 1,
      limit = 10,
    } = query;

    const { items, total } = await this.products.list(
      { search, categoryId, available, branchId },
      { sortBy, sortOrder },
      { page, limit },
    );

    return {
      items: items.map((item) => this.formatProduct(item as ProductLean)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(id)) {
      const error = new Error("Invalid product ID");
      (error as { code?: string }).code = "INVALID_ID";
      throw error;
    }

    const product = await this.products.findLeanById(id);

    if (!product) {
      const error = new Error("Product not found");
      (error as { code?: string }).code = "NOT_FOUND";
      throw error;
    }

    return this.formatProduct(product as ProductLean);
  }

  async create(input: ProductCreateInput) {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(input.categoryId)) {
      const error = new Error("Invalid category ID");
      (error as { code?: string }).code = "INVALID_CATEGORY";
      throw error;
    }

    const category = await this.categories.findLeanById(input.categoryId);

    if (!category) {
      const error = new Error("Category not found");
      (error as { code?: string }).code = "CATEGORY_NOT_FOUND";
      throw error;
    }

    const existingSku = await this.products.findBySku(input.sku);

    if (existingSku) {
      const error = new Error("Product with this SKU already exists");
      (error as { code?: string }).code = "SKU_EXISTS";
      throw error;
    }

    const product = await this.products.create({
      name: input.name,
      sku: input.sku,
      categoryId: new Types.ObjectId(input.categoryId),
      image: input.image,
      price: input.price,
      cost: input.cost,
      available: input.available ?? true,
      stock: input.stock ?? 0,
      lowStockThreshold: input.lowStockThreshold ?? 0,
      branchId: input.branchId ? new Types.ObjectId(input.branchId) : undefined,
      description: input.description,
      variants: input.variants || [],
      addons: input.addons || [],
    });

    const populated = await this.products.findLeanById(String(product._id));

    return this.formatProduct(populated as ProductLean);
  }

  async update(id: string, input: ProductUpdateInput) {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(id)) {
      const error = new Error("Invalid product ID");
      (error as { code?: string }).code = "INVALID_ID";
      throw error;
    }

    if (input.categoryId && Types.ObjectId.isValid(input.categoryId)) {
      const category = await this.categories.findLeanById(input.categoryId);

      if (!category) {
        const error = new Error("Category not found");
        (error as { code?: string }).code = "CATEGORY_NOT_FOUND";
        throw error;
      }
    }

    if (input.sku) {
      const existingSku = await this.products.findDuplicateSku(id, input.sku);

      if (existingSku) {
        const error = new Error("Product with this SKU already exists");
        (error as { code?: string }).code = "SKU_EXISTS";
        throw error;
      }
    }

    const updateData = { ...input } as Record<string, unknown>;
    if (input.categoryId) {
      updateData.categoryId = new Types.ObjectId(input.categoryId);
    }
    if (input.branchId) {
      updateData.branchId = new Types.ObjectId(input.branchId);
    }

    const product = await this.products.updateById(id, updateData);

    if (!product) {
      const error = new Error("Product not found");
      (error as { code?: string }).code = "NOT_FOUND";
      throw error;
    }

    return this.formatProduct(product as ProductLean);
  }

  async delete(id: string) {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(id)) {
      const error = new Error("Invalid product ID");
      (error as { code?: string }).code = "INVALID_ID";
      throw error;
    }

    const product = await this.products.deleteById(id);

    if (!product) {
      const error = new Error("Product not found");
      (error as { code?: string }).code = "NOT_FOUND";
      throw error;
    }

    return {
      id: String(product._id),
      name: product.name,
      sku: product.sku,
    };
  }

  async updateStock(id: string, quantity: number) {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(id)) {
      const error = new Error("Invalid product ID");
      (error as { code?: string }).code = "INVALID_ID";
      throw error;
    }

    const product = await this.products.updateStockById(id, quantity);

    if (!product) {
      const error = new Error("Product not found");
      (error as { code?: string }).code = "NOT_FOUND";
      throw error;
    }

    return this.formatProduct(product as ProductLean);
  }
}
