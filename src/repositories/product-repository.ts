import { Types } from "mongoose";
import { ProductModel } from "@/models/product";

export type ProductFilter = {
  search?: string;
  categoryId?: string;
  available?: boolean;
  branchId?: string;
};

export class ProductRepository {
  async findById(id: string) {
    return ProductModel.findById(id).populate("categoryId", "name").exec();
  }

  async findLeanById(id: string) {
    return ProductModel.findById(id)
      .populate("categoryId", "name")
      .lean()
      .exec();
  }

  async findBySku(sku: string) {
    return ProductModel.findOne({ sku }).lean().exec();
  }

  async findDuplicateSku(id: string, sku: string) {
    return ProductModel.findOne({
      _id: { $ne: new Types.ObjectId(id) },
      sku,
    })
      .lean()
      .exec();
  }

  async countByCategoryId(categoryId: string) {
    return ProductModel.countDocuments({
      categoryId: new Types.ObjectId(categoryId),
    }).exec();
  }

  async list(
    filter: ProductFilter,
    sort: { sortBy: string; sortOrder: "asc" | "desc" },
    pagination: { page: number; limit: number },
  ) {
    const query: Record<string, unknown> = {};

    if (filter.available !== undefined) {
      query.available = filter.available;
    }

    if (filter.categoryId && Types.ObjectId.isValid(filter.categoryId)) {
      query.categoryId = new Types.ObjectId(filter.categoryId);
    }

    if (filter.branchId && Types.ObjectId.isValid(filter.branchId)) {
      query.branchId = new Types.ObjectId(filter.branchId);
    }

    if (filter.search) {
      const search = filter.search.trim();
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const direction = sort.sortOrder === "asc" ? 1 : -1;
    const skip = (pagination.page - 1) * pagination.limit;

    const total = await ProductModel.countDocuments(query).exec();
    const items = await ProductModel.find(query)
      .populate("categoryId", "name")
      .sort({ [sort.sortBy]: direction })
      .skip(skip)
      .limit(pagination.limit)
      .lean()
      .exec();

    return { items, total };
  }

  async create(payload: Parameters<typeof ProductModel.create>[0]) {
    return ProductModel.create(payload);
  }

  async updateById(id: string, payload: Record<string, unknown>) {
    return ProductModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    })
      .populate("categoryId", "name")
      .lean()
      .exec();
  }

  async deleteById(id: string) {
    return ProductModel.findByIdAndDelete(id).lean().exec();
  }

  async updateStockById(id: string, quantity: number) {
    return ProductModel.findByIdAndUpdate(
      id,
      { $set: { stock: Math.max(0, quantity) } },
      { new: true, runValidators: true },
    )
      .populate("categoryId", "name")
      .lean()
      .exec();
  }
}
