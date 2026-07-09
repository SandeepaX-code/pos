import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { schemaOptions } from "@/models/_shared";

const ProductVariantSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const ProductAddonSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    sku: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    image: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: true, min: 0 },
    available: { type: Boolean, default: true },
    stock: { type: Number, default: 0, min: 0 },
    recipe: [{ type: Schema.Types.ObjectId, ref: "Recipe" }],
    variants: [ProductVariantSchema],
    addons: [ProductAddonSchema],
    lowStockThreshold: { type: Number, default: 0, min: 0 },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", index: true },
    description: { type: String, trim: true },
  },
  schemaOptions,
);

ProductSchema.index({ branchId: 1, categoryId: 1, available: 1 });

export type ProductEntity = InferSchemaType<typeof ProductSchema>;
export type ProductDocument = HydratedDocument<ProductEntity>;

export const ProductModel = models.Product || model("Product", ProductSchema);
