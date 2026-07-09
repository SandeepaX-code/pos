import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { schemaOptions } from "@/models/_shared";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    icon: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  schemaOptions,
);

CategorySchema.index({ active: 1, sortOrder: 1, name: 1 });

export type CategoryEntity = InferSchemaType<typeof CategorySchema>;
export type CategoryDocument = HydratedDocument<CategoryEntity>;

export const CategoryModel =
  models.Category || model("Category", CategorySchema);
