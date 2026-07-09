import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { schemaOptions } from "@/models/_shared";

const PermissionSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    label: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    group: { type: String, required: true, trim: true },
  },
  schemaOptions,
);

PermissionSchema.index({ group: 1, key: 1 });

export type PermissionEntity = InferSchemaType<typeof PermissionSchema>;
export type PermissionDocument = HydratedDocument<PermissionEntity>;

export const PermissionModel =
  models.Permission || model("Permission", PermissionSchema);
