import { ClientSession } from "mongoose";
import { NotificationModel } from "@/models/notification";
import type { NotificationDocument } from "@/models/notification";

export class NotificationRepository {
  async findById(
    id: string,
    session?: ClientSession,
  ): Promise<NotificationDocument | null> {
    const q = NotificationModel.findById(id);
    if (session) q.session(session);
    return q.exec();
  }

  async findLeanById(id: string, session?: ClientSession) {
    const q = NotificationModel.findById(id).lean();
    if (session) q.session(session);
    return q.exec();
  }

  async create(
    payload: Record<string, unknown> | Array<Record<string, unknown>>,
    session?: ClientSession,
  ): Promise<NotificationDocument> {
    if (session) {
      const docs = await NotificationModel.create(
        Array.isArray(payload) ? payload : [payload],
        { session },
      );
      return docs[0];
    }
    const docs = await NotificationModel.create(
      Array.isArray(payload) ? payload : [payload],
    );
    return Array.isArray(payload) ? docs[0] : (docs as unknown as NotificationDocument);
  }

  async updateById(
    id: string,
    payload: Record<string, unknown>,
    session?: ClientSession,
  ): Promise<NotificationDocument | null> {
    const q = NotificationModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (session) q.session(session);
    return q.exec();
  }

  async deleteById(
    id: string,
    session?: ClientSession,
  ): Promise<NotificationDocument | null> {
    const q = NotificationModel.findByIdAndDelete(id);
    if (session) q.session(session);
    return q.exec();
  }

  async count(filter: Record<string, unknown>): Promise<number> {
    return NotificationModel.countDocuments(filter).exec();
  }

  async list(filter: Record<string, unknown>) {
    return NotificationModel.find(filter).lean().exec();
  }
}
