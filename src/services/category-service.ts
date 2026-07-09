import { Types } from "mongoose";
import { CategoryModel } from "@/models/category";
import { connectToDatabase } from "@/lib/mongoose";

export type CategoryListQuery = {
  search?: string;
  active?: boolean;
  sortBy?: "name" | "sortOrder" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type CategoryListResult = {
  items: Array<{
    id: string;
    name: string;
    slug: string;
    icon: string;
    image: string;
    color: string;
    active: boolean;
    sortOrder: number;
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

export type CategoryCreateInput = {
  name: string;
  slug: string;
  icon: string;
  image: string;
  color: string;
  active?: boolean;
  sortOrder?: number;
};

export type CategoryUpdateInput = Partial<CategoryCreateInput>;

export class CategoryService {
  async list(query: CategoryListQuery): Promise<CategoryListResult> {
    await connectToDatabase();

    const {
      search,
      active,
      sortBy = "sortOrder",
      sortOrder = "asc",
      page = 1,
      limit = 10,
    } = query;

    const filter: Record<string, unknown> = {};

    if (active !== undefined) {
      filter.active = active;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const direction = sortOrder === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      CategoryModel.find(filter)
        .sort({ [sortBy]: direction })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      CategoryModel.countDocuments(filter),
    ]);

    return {
      items: items.map((item) => ({
        id: String(item._id),
        name: item.name,
        slug: item.slug,
        icon: item.icon,
        image: item.image,
        color: item.color,
        active: item.active,
        sortOrder: item.sortOrder,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
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
      const error = new Error("Invalid category ID");
      (error as { code?: string }).code = "INVALID_ID";
      throw error;
    }

    const category = await CategoryModel.findById(id).lean().exec();

    if (!category) {
      const error = new Error("Category not found");
      (error as { code?: string }).code = "NOT_FOUND";
      throw error;
    }

    return {
      id: String(category._id),
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      image: category.image,
      color: category.color,
      active: category.active,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }

  async create(input: CategoryCreateInput) {
    await connectToDatabase();

    const existing = await CategoryModel.findOne({
      slug: input.slug,
    })
      .lean()
      .exec();

    if (existing) {
      const error = new Error("Category with this slug already exists");
      (error as { code?: string }).code = "SLUG_EXISTS";
      throw error;
    }

    const category = await CategoryModel.create({
      name: input.name,
      slug: input.slug,
      icon: input.icon,
      image: input.image,
      color: input.color,
      active: input.active ?? true,
      sortOrder: input.sortOrder ?? 0,
    });

    return {
      id: String(category._id),
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      image: category.image,
      color: category.color,
      active: category.active,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }

  async update(id: string, input: CategoryUpdateInput) {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(id)) {
      const error = new Error("Invalid category ID");
      (error as { code?: string }).code = "INVALID_ID";
      throw error;
    }

    if (input.slug) {
      const existing = await CategoryModel.findOne({
        _id: { $ne: new Types.ObjectId(id) },
        slug: input.slug,
      })
        .lean()
        .exec();

      if (existing) {
        const error = new Error("Category with this slug already exists");
        (error as { code?: string }).code = "SLUG_EXISTS";
        throw error;
      }
    }

    const category = await CategoryModel.findByIdAndUpdate(id, input, {
      new: true,
      runValidators: true,
    })
      .lean()
      .exec();

    if (!category) {
      const error = new Error("Category not found");
      (error as { code?: string }).code = "NOT_FOUND";
      throw error;
    }

    return {
      id: String(category._id),
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      image: category.image,
      color: category.color,
      active: category.active,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }

  async delete(id: string) {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(id)) {
      const error = new Error("Invalid category ID");
      (error as { code?: string }).code = "INVALID_ID";
      throw error;
    }

    const category = await CategoryModel.findByIdAndDelete(id)
      .lean()
      .exec();

    if (!category) {
      const error = new Error("Category not found");
      (error as { code?: string }).code = "NOT_FOUND";
      throw error;
    }

    return {
      id: String(category._id),
      name: category.name,
    };
  }
}
