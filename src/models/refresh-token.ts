import bcrypt from "bcryptjs";
import { model, models, Schema, type InferSchemaType } from "mongoose";

import { schemaOptions } from "@/models/_shared";

const RefreshTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Never store the plain refresh token
    tokenHash: { type: String, required: true, unique: true, index: true },

    expiresAt: { type: Date, required: true, index: true },
    revoked: { type: Boolean, default: false, index: true },
    replacedByToken: { type: String, default: null },

    deviceInfo: { type: Schema.Types.Mixed, default: undefined },
    ipAddress: { type: String, trim: true, default: undefined },
  },
  schemaOptions,
);

RefreshTokenSchema.index({ userId: 1, revoked: 1, expiresAt: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshTokenEntity = InferSchemaType<typeof RefreshTokenSchema>;

export type RefreshTokenDocument = RefreshTokenEntity & {
  compareToken(token: string): Promise<boolean>;
};

RefreshTokenSchema.methods.compareToken = function compareToken(token: string) {
  return bcrypt.compare(token, this.tokenHash);
};

export const RefreshTokenModel =
  models.RefreshToken || model("RefreshToken", RefreshTokenSchema);
