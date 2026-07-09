import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { schemaOptions } from "@/models/_shared";

const SettingSchema = new Schema(
  {
    key: { type: String, required: true, trim: true, index: true },
    label: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String, trim: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", index: true },
    active: { type: Boolean, default: true },
  },
  schemaOptions,
);

SettingSchema.index({ key: 1, branchId: 1 }, { unique: true });

export type SettingEntity = InferSchemaType<typeof SettingSchema>;
export type SettingDocument = HydratedDocument<SettingEntity>;

export const SettingModel = models.Setting || model("Setting", SettingSchema);
