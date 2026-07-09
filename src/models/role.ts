import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { schemaOptions } from "@/models/_shared";

const RoleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    label: { type: String, required: true, trim: true },
    permissions: [{ type: Schema.Types.ObjectId, ref: "Permission" }],
    description: { type: String, trim: true },
    active: { type: Boolean, default: true },
    system: { type: Boolean, default: false, index: true },
  },
  schemaOptions,
);

RoleSchema.index({ active: 1, name: 1 });
RoleSchema.index({ system: 1, active: 1 });

export type RoleEntity = InferSchemaType<typeof RoleSchema>;
export type RoleDocument = HydratedDocument<RoleEntity>;

export const RoleModel = models.Role || model("Role", RoleSchema);
