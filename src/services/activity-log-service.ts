import { Types } from "mongoose";

import { ActivityLogModel } from "@/models/activity-log";

export type ActivityActor = {
  id: string;
  name: string;
  branchId: string;
};

export type ActivityLogInput = {
  action: string;
  entity: string;
  entityId: string;
  actor: ActivityActor;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
};

export class ActivityLogService {
  async log(input: ActivityLogInput) {
    await ActivityLogModel.create({
      userId: new Types.ObjectId(input.actor.id),
      userName: input.actor.name,
      action: input.action,
      entity: input.entity,
      entityId: new Types.ObjectId(input.entityId),
      branchId: new Types.ObjectId(input.actor.branchId),
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  }

  async listByEntity(
    entity: string,
    entityId: string,
    pagination: { page: number; limit: number },
  ) {
    const filter = {
      entity,
      entityId: new Types.ObjectId(entityId),
    };

    const total = await ActivityLogModel.countDocuments(filter).exec();
    const items = await ActivityLogModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit)
      .lean()
      .exec();

    return {
      items: items.map((log) => ({
        id: String(log._id),
        action: log.action,
        entity: log.entity,
        entityId: String(log.entityId),
        userId: String(log.userId),
        userName: log.userName,
        branchId: String(log.branchId),
        metadata: log.metadata ?? undefined,
        ipAddress: log.ipAddress ?? undefined,
        userAgent: log.userAgent ?? undefined,
        createdAt:
          log.createdAt instanceof Date
            ? log.createdAt.toISOString()
            : String(log.createdAt),
      })),
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
    };
  }
}
