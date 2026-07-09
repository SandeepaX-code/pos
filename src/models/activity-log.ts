import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

import { schemaOptions } from "@/models/_shared";

const ActivityLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true, index: true },
    entity: { type: String, required: true, trim: true, index: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  schemaOptions,
);

export type ActivityLogEntity = InferSchemaType<typeof ActivityLogSchema>;
export type ActivityLogDocument = HydratedDocument<ActivityLogEntity>;

export const ActivityLogModel =
  models.ActivityLog || model("ActivityLog", ActivityLogSchema);
