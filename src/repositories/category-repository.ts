import { Types } from "mongoose";
import { CategoryModel } from "@/models/category";

export type CategoryFilter = {
  search?: string;
  active?: boolean;
};

export class CategoryRepository {
  async findById(id: string) {
    return CategoryModel.findById(id).exec();
  }

  async findLeanById(id: string) {
    return CategoryModel.findById(id).lean().exec();
  }

  async findBySlug(slug: string) {
    return CategoryModel.findOne({ slug }).lean().exec();
  }

  async findDuplicateSlug(id: string, slug: string) {
    return CategoryModel.findOne({
      _id: { $ne: new Types.ObjectId(id) },
      slug,
    })
      .lean()
      .exec();
  }

  async list(
    filter: CategoryFilter,
    sort: { sortBy: string; sortOrder: "asc" | "desc" },
    pagination: { page: number; limit: number },
  ) {
    const query: Record<string, unknown> = {};

    if (filter.active !== undefined) {
      query.active = filter.active;
    }

    if (filter.search) {
      const search = filter.search.trim();
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const direction = sort.sortOrder === "asc" ? 1 : -1;
    const skip = (pagination.page - 1) * pagination.limit;

    const total = await CategoryModel.countDocuments(query).exec();
    const items = await CategoryModel.find(query)
      .sort({ [sort.sortBy]: direction })
      .skip(skip)
      .limit(pagination.limit)
      .lean()
      .exec();

    return { items, total };
  }

  async create(payload: Parameters<typeof CategoryModel.create>[0]) {
    return CategoryModel.create(payload);
  }

  async updateById(id: string, payload: Record<string, unknown>) {
    return CategoryModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    })
      .lean()
      .exec();
  }

  async deleteById(id: string) {
    return CategoryModel.findByIdAndDelete(id).lean().exec();
  }
}
