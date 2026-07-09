import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { recipeIngredientSchema, schemaOptions } from "@/models/_shared";

const RecipeSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    yieldCount: { type: Number, required: true, min: 1 },
    ingredients: [recipeIngredientSchema],
    instructions: [{ type: String, trim: true }],
    active: { type: Boolean, default: true },
  },
  schemaOptions,
);

RecipeSchema.index({ active: 1, productId: 1 });

export type RecipeEntity = InferSchemaType<typeof RecipeSchema>;
export type RecipeDocument = HydratedDocument<RecipeEntity>;

export const RecipeModel = models.Recipe || model("Recipe", RecipeSchema);
