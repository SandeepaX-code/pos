import { ClientSession } from "mongoose";
import { KitchenOrderModel } from "@/models/kitchen-order";
import type { KitchenOrderDocument } from "@/models/kitchen-order";

export class KitchenOrderRepository {
  async findById(
    id: string,
    session?: ClientSession,
  ): Promise<KitchenOrderDocument | null> {
    const q = KitchenOrderModel.findById(id);
    if (session) q.session(session);
    return q.exec();
  }

  async findLeanById(id: string, session?: ClientSession) {
    const q = KitchenOrderModel.findById(id).lean();
    if (session) q.session(session);
    return q.exec();
  }

  async findByOrderId(
    orderId: string,
    session?: ClientSession,
  ): Promise<KitchenOrderDocument | null> {
    const q = KitchenOrderModel.findOne({ orderId });
    if (session) q.session(session);
    return q.exec();
  }

  async create(
    payload: Record<string, unknown> | Array<Record<string, unknown>>,
    session?: ClientSession,
  ): Promise<KitchenOrderDocument> {
    if (session) {
      const docs = await KitchenOrderModel.create(
        Array.isArray(payload) ? payload : [payload],
        { session },
      );
      return docs[0];
    }
    const docs = await KitchenOrderModel.create(
      Array.isArray(payload) ? payload : [payload],
    );
    return Array.isArray(payload) ? docs[0] : (docs as unknown as KitchenOrderDocument);
  }

  async updateById(
    id: string,
    payload: Record<string, unknown>,
    session?: ClientSession,
  ): Promise<KitchenOrderDocument | null> {
    const q = KitchenOrderModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (session) q.session(session);
    return q.exec();
  }

  async deleteById(
    id: string,
    session?: ClientSession,
  ): Promise<KitchenOrderDocument | null> {
    const q = KitchenOrderModel.findByIdAndDelete(id);
    if (session) q.session(session);
    return q.exec();
  }

  async count(filter: Record<string, unknown>): Promise<number> {
    return KitchenOrderModel.countDocuments(filter).exec();
  }

  async list(filter: Record<string, unknown>) {
    return KitchenOrderModel.find(filter).lean().exec();
  }
}
