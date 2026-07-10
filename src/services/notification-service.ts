import { connectToDatabase } from "@/lib/mongoose";
import { NotificationRepository } from "@/repositories/notification-repository";

export class NotificationService {
  private readonly notifications = new NotificationRepository();

  async list(filter: Record<string, unknown> = {}) {
    await connectToDatabase();
    return this.notifications.list(filter);
  }

  async getById(id: string) {
    await connectToDatabase();
    const notification = await this.notifications.findLeanById(id);
    if (!notification) {
      throw new Error("Notification not found");
    }
    return notification;
  }

  async create(payload: Record<string, unknown>) {
    await connectToDatabase();
    return this.notifications.create(payload);
  }

  async markAsRead(id: string) {
    await connectToDatabase();
    const updated = await this.notifications.updateById(id, {
      readAt: new Date(),
    });
    if (!updated) {
      throw new Error("Notification not found");
    }
    return updated;
  }

  async markAllAsRead(branchId: string, recipientId?: string) {
    await connectToDatabase();
    const filter: Record<string, unknown> = { branchId, readAt: { $exists: false } };
    if (recipientId) {
      filter.recipientId = recipientId;
    }
    const list = await this.notifications.list(filter);
    const results = [];
    for (const notif of list) {
      const updated = await this.notifications.updateById(String(notif._id), {
        readAt: new Date(),
      });
      if (updated) results.push(updated);
    }
    return results;
  }
}
