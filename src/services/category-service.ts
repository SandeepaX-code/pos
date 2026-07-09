import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongoose";
import { CategoryRepository } from "@/repositories/category-repository";
import { ProductRepository } from "@/repositories/product-repository";

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
  private readonly categories = new CategoryRepository();
  private readonly products = new ProductRepository();

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

    const { items, total } = await this.categories.list(
      { search, active },
      { sortBy, sortOrder },
      { page, limit },
    );

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

    const category = await this.categories.findLeanById(id);

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

    const existing = await this.categories.findBySlug(input.slug);

    if (existing) {
      const error = new Error("Category with this slug already exists");
      (error as { code?: string }).code = "SLUG_EXISTS";
      throw error;
    }

    const category = await this.categories.create({
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
      const existing = await this.categories.findDuplicateSlug(id, input.slug);

      if (existing) {
        const error = new Error("Category with this slug already exists");
        (error as { code?: string }).code = "SLUG_EXISTS";
        throw error;
      }
    }

    const category = await this.categories.updateById(id, input);

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

    const productCount = await this.products.countByCategoryId(id);
    if (productCount > 0) {
      const error = new Error("Cannot delete category with associated products");
      (error as { code?: string }).code = "CATEGORY_IN_USE";
      throw error;
    }

    const category = await this.categories.deleteById(id);

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
