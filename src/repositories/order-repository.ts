import { ClientSession } from "mongoose";
import { OrderModel } from "@/models/order";
import type { OrderDocument } from "@/models/order";

export class OrderRepository {
  async findById(
    id: string,
    session?: ClientSession,
  ): Promise<OrderDocument | null> {
    const q = OrderModel.findById(id);
    if (session) q.session(session);
    return q.exec();
  }

  async findLeanById(id: string, session?: ClientSession) {
    const q = OrderModel.findById(id).lean();
    if (session) q.session(session);
    return q.exec();
  }

  async create(
    payload: Record<string, unknown> | Array<Record<string, unknown>>,
    session?: ClientSession,
  ): Promise<OrderDocument> {
    if (session) {
      const docs = await OrderModel.create(
        Array.isArray(payload) ? payload : [payload],
        { session },
      );
      return docs[0];
    }
    const docs = await OrderModel.create(
      Array.isArray(payload) ? payload : [payload],
    );
    return Array.isArray(payload) ? docs[0] : (docs as unknown as OrderDocument);
  }

  async updateById(
    id: string,
    payload: Record<string, unknown>,
    session?: ClientSession,
  ): Promise<OrderDocument | null> {
    const q = OrderModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (session) q.session(session);
    return q.exec();
  }

  async updateOne(
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
    session?: ClientSession,
  ) {
    const q = OrderModel.updateOne(filter, update);
    if (session) q.session(session);
    return q.exec();
  }

  async deleteById(
    id: string,
    session?: ClientSession,
  ): Promise<OrderDocument | null> {
    const q = OrderModel.findByIdAndDelete(id);
    if (session) q.session(session);
    return q.exec();
  }

  async count(filter: Record<string, unknown>) {
    return OrderModel.countDocuments(filter).exec();
  }

  async list(filter: Record<string, unknown>) {
    return OrderModel.find(filter).lean().exec();
  }
}
