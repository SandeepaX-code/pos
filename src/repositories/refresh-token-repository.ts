import bcrypt from "bcryptjs";
import { RefreshTokenModel } from "@/models/refresh-token";

export class RefreshTokenRepository {
  async hashToken(token: string) {
    return bcrypt.hash(token, 12);
  }

  async findActiveByTokenHash(tokenHash: string) {
    return RefreshTokenModel.findOne({ tokenHash, revoked: false });
  }

  async revokeById(id: string, replacedByToken?: string | null) {
    await RefreshTokenModel.updateOne(
      { _id: id },
      {
        $set: {
          revoked: true,
          replacedByToken: replacedByToken ?? null,
          updatedAt: new Date(),
        },
      },
    );
  }

  async create(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    deviceInfo?: unknown;
    ipAddress?: string;
  }) {
    const doc = await RefreshTokenModel.create({
      userId: params.userId,
      tokenHash: params.tokenHash,
      expiresAt: params.expiresAt,
      revoked: false,
      replacedByToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceInfo: params.deviceInfo,
      ipAddress: params.ipAddress,
    });

    return doc;
  }
}
