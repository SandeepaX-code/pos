import { RecipeModel } from "@/models/recipe";

export class RecipeRepository {
  async findById(id: string) {
    return RecipeModel.findById(id).exec();
  }

  async findLeanById(id: string) {
    return RecipeModel.findById(id).lean().exec();
  }

  async findOne(queryFilter: Record<string, unknown>) {
    return RecipeModel.findOne(queryFilter).exec();
  }

  async findLeanOne(queryFilter: Record<string, unknown>) {
    return RecipeModel.findOne(queryFilter).lean().exec();
  }

  async find(queryFilter: Record<string, unknown> = {}) {
    return RecipeModel.find(queryFilter).lean().exec();
  }

  async create(payload: Parameters<typeof RecipeModel.create>[0]) {
    return RecipeModel.create(payload);
  }

  async updateById(id: string, payload: Record<string, unknown>) {
    return RecipeModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    })
      .lean()
      .exec();
  }

  async deleteById(id: string) {
    return RecipeModel.findByIdAndDelete(id).lean().exec();
  }
}
