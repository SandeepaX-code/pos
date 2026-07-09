import { ClientSession } from "mongoose";
import { PurchaseOrderModel } from "@/models/purchase-order";
import type { PurchaseOrderDocument } from "@/models/purchase-order";

export class PurchaseOrderRepository {
  async findById(
    id: string,
    session?: ClientSession,
  ): Promise<PurchaseOrderDocument | null> {
    const q = PurchaseOrderModel.findById(id);
    if (session) q.session(session);
    return q.exec();
  }

  async findLeanById(id: string, session?: ClientSession) {
    const q = PurchaseOrderModel.findById(id).lean();
    if (session) q.session(session);
    return q.exec();
  }

  async findByPoNumber(
    purchaseOrderNumber: string,
    session?: ClientSession,
  ): Promise<PurchaseOrderDocument | null> {
    const q = PurchaseOrderModel.findOne({ purchaseOrderNumber });
    if (session) q.session(session);
    return q.exec();
  }

  async create(
    payload: Record<string, unknown> | Array<Record<string, unknown>>,
    session?: ClientSession,
  ): Promise<PurchaseOrderDocument> {
    if (session) {
      const docs = await PurchaseOrderModel.create(
        Array.isArray(payload) ? payload : [payload],
        { session },
      );
      return docs[0];
    }
    const docs = await PurchaseOrderModel.create(
      Array.isArray(payload) ? payload : [payload],
    );
    return Array.isArray(payload)
      ? docs[0]
      : (docs as unknown as PurchaseOrderDocument);
  }

  async updateById(
    id: string,
    payload: Record<string, unknown>,
    session?: ClientSession,
  ): Promise<PurchaseOrderDocument | null> {
    const q = PurchaseOrderModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (session) q.session(session);
    return q.exec();
  }

  async deleteById(
    id: string,
    session?: ClientSession,
  ): Promise<PurchaseOrderDocument | null> {
    const q = PurchaseOrderModel.findByIdAndDelete(id);
    if (session) q.session(session);
    return q.exec();
  }

  async list(filter: Record<string, unknown> = {}) {
    return PurchaseOrderModel.find(filter).lean().exec();
  }

  async count(filter: Record<string, unknown> = {}) {
    return PurchaseOrderModel.countDocuments(filter).exec();
  }
}
