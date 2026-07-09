import { Types } from "mongoose";
import { RecipeModel } from "@/models/recipe";
import { connectToDatabase } from "@/lib/mongoose";

export type RecipeItemInput = {
  productId: string; // ingredient product (inventory product)
  name: string;
  quantity: number;
  unit: string;
  cost?: number;
  wastageRate?: number; // percent
};

export type RecipeCreateInput = {
  productId: string; // menu product
  name: string;
  yieldCount: number;
  ingredients: RecipeItemInput[];
  instructions?: string[];
  active?: boolean;
};

export class RecipeService {
  async list() {
    await connectToDatabase();
    const items = await RecipeModel.find().lean().exec();
    return items.map((r) => ({
      id: String(r._id),
      productId: String(r.productId),
      name: r.name,
      yieldCount: r.yieldCount,
      ingredients: r.ingredients,
      instructions: r.instructions,
      active: r.active,
      createdAt: r.createdAt?.toISOString(),
      updatedAt: r.updatedAt?.toISOString(),
    }));
  }

  async getById(id: string) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) {
      const err = new Error("Invalid id");
      (err as { code?: string }).code = "INVALID_ID";
      throw err;
    }

    const r = await RecipeModel.findById(id).lean().exec();
    if (!r) {
      const err = new Error("Recipe not found");
      (err as { code?: string }).code = "NOT_FOUND";
      throw err;
    }

    return {
      id: String(r._id),
      productId: String(r.productId),
      name: r.name,
      yieldCount: r.yieldCount,
      ingredients: r.ingredients,
      instructions: r.instructions,
      active: r.active,
      createdAt: r.createdAt?.toISOString(),
      updatedAt: r.updatedAt?.toISOString(),
    };
  }

  async getByProductId(productId: string) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(productId)) return null;
    const r = await RecipeModel.findOne({ productId: new Types.ObjectId(productId) }).lean().exec();
    if (!r) return null;
    return {
      id: String(r._id),
      productId: String(r.productId),
      name: r.name,
      yieldCount: r.yieldCount,
      ingredients: r.ingredients,
      instructions: r.instructions,
      active: r.active,
      createdAt: r.createdAt?.toISOString(),
      updatedAt: r.updatedAt?.toISOString(),
    };
  }

  async create(input: RecipeCreateInput) {
    await connectToDatabase();

    // ensure productId is valid and unique
    if (!Types.ObjectId.isValid(input.productId)) {
      const err = new Error("Invalid productId");
      (err as { code?: string }).code = "INVALID_PRODUCT";
      throw err;
    }

    const existing = await RecipeModel.findOne({ productId: new Types.ObjectId(input.productId) }).lean().exec();
    if (existing) {
      const err = new Error("Recipe for this product already exists");
      (err as { code?: string }).code = "ALREADY_EXISTS";
      throw err;
    }

    const recipe = await RecipeModel.create({
      productId: new Types.ObjectId(input.productId),
      name: input.name,
      yieldCount: input.yieldCount,
      ingredients: input.ingredients,
      instructions: input.instructions ?? [],
      active: input.active ?? true,
    });

    return { id: String(recipe._id) };
  }

  async update(id: string, input: Partial<RecipeCreateInput>) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) {
      const err = new Error("Invalid id");
      (err as { code?: string }).code = "INVALID_ID";
      throw err;
    }

    const updateData: Record<string, unknown> = { ...input };
    if (input.productId) {
      if (!Types.ObjectId.isValid(input.productId)) {
        const err = new Error("Invalid productId");
        (err as { code?: string }).code = "INVALID_PRODUCT";
        throw err;
      }
      updateData.productId = new Types.ObjectId(input.productId);
    }

    const recipe = await RecipeModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).lean().exec();
    if (!recipe) {
      const err = new Error("Recipe not found");
      (err as { code?: string }).code = "NOT_FOUND";
      throw err;
    }

    return { id: String(recipe._id) };
  }

  async delete(id: string) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) {
      const err = new Error("Invalid id");
      (err as { code?: string }).code = "INVALID_ID";
      throw err;
    }

    const deleted = await RecipeModel.findByIdAndDelete(id).lean().exec();
    if (!deleted) {
      const err = new Error("Recipe not found");
      (err as { code?: string }).code = "NOT_FOUND";
      throw err;
    }

    return { id: String(deleted._id) };
  }
}
