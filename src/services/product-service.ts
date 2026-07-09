import { Types } from "mongoose";
import { ProductModel, type ProductDocument } from "@/models/product";
import { CategoryModel } from "@/models/category";
import { connectToDatabase } from "@/lib/mongoose";

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
  private formatProduct(product: ProductLean) {
    let categoryId = "";
    let categoryName: string | undefined;

    if (product.categoryId instanceof Types.ObjectId) {
      categoryId = String(product.categoryId);
    } else if (typeof product.categoryId === "object" && product.categoryId !== null) {
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

    const filter: Record<string, unknown> = {};

    if (available !== undefined) {
      filter.available = available;
    }

    if (categoryId && Types.ObjectId.isValid(categoryId)) {
      filter.categoryId = new Types.ObjectId(categoryId);
    }

    if (branchId && Types.ObjectId.isValid(branchId)) {
      filter.branchId = new Types.ObjectId(branchId);
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const direction = sortOrder === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      ProductModel.find(filter)
        .populate("categoryId", "name")
        .sort({ [sortBy]: direction })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      ProductModel.countDocuments(filter),
    ]);

    return {
      items: items.map((item) => this.formatProduct(item)),
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

    const product = await ProductModel.findById(id)
      .populate("categoryId", "name")
      .lean()
      .exec();

    if (!product) {
      const error = new Error("Product not found");
      (error as { code?: string }).code = "NOT_FOUND";
      throw error;
    }

    return this.formatProduct(product);
  }

  async create(input: ProductCreateInput) {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(input.categoryId)) {
      const error = new Error("Invalid category ID");
      (error as { code?: string }).code = "INVALID_CATEGORY";
      throw error;
    }

    const category = await CategoryModel.findById(input.categoryId)
      .lean()
      .exec();

    if (!category) {
      const error = new Error("Category not found");
      (error as { code?: string }).code = "CATEGORY_NOT_FOUND";
      throw error;
    }

    const existingSku = await ProductModel.findOne({ sku: input.sku })
      .lean()
      .exec();

    if (existingSku) {
      const error = new Error("Product with this SKU already exists");
      (error as { code?: string }).code = "SKU_EXISTS";
      throw error;
    }

    const product = await ProductModel.create({
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

    const populated = await ProductModel.findById(product._id)
      .populate("categoryId", "name")
      .lean()
      .exec();

    return this.formatProduct(populated);
  }

  async update(id: string, input: ProductUpdateInput) {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(id)) {
      const error = new Error("Invalid product ID");
      (error as { code?: string }).code = "INVALID_ID";
      throw error;
    }

    if (input.categoryId && Types.ObjectId.isValid(input.categoryId)) {
      const category = await CategoryModel.findById(input.categoryId)
        .lean()
        .exec();

      if (!category) {
        const error = new Error("Category not found");
        (error as { code?: string }).code = "CATEGORY_NOT_FOUND";
        throw error;
      }
    }

    if (input.sku) {
      const existingSku = await ProductModel.findOne({
        _id: { $ne: new Types.ObjectId(id) },
        sku: input.sku,
      })
        .lean()
        .exec();

      if (existingSku) {
        const error = new Error("Product with this SKU already exists");
        (error as { code?: string }).code = "SKU_EXISTS";
        throw error;
      }
    }

    const updateData = { ...input };
    if (input.categoryId) {
      updateData.categoryId = new Types.ObjectId(input.categoryId) as unknown as string;
    }
    if (input.branchId) {
      updateData.branchId = new Types.ObjectId(input.branchId) as unknown as string;
    }

    const product = await ProductModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("categoryId", "name")
      .lean()
      .exec();

    if (!product) {
      const error = new Error("Product not found");
      (error as { code?: string }).code = "NOT_FOUND";
      throw error;
    }

    return this.formatProduct(product);
  }

  async delete(id: string) {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(id)) {
      const error = new Error("Invalid product ID");
      (error as { code?: string }).code = "INVALID_ID";
      throw error;
    }

    const product = await ProductModel.findByIdAndDelete(id)
      .lean()
      .exec();

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

    const product = await ProductModel.findByIdAndUpdate(
      id,
      { $set: { stock: Math.max(0, quantity) } },
      { new: true, runValidators: true },
    )
      .lean()
      .exec();

    if (!product) {
      const error = new Error("Product not found");
      (error as { code?: string }).code = "NOT_FOUND";
      throw error;
    }

    return this.formatProduct(product);
  }
}
