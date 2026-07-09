import { ClientSession } from "mongoose";
import { PaymentModel } from "@/models/payment";
import type { PaymentDocument } from "@/models/payment";

export class PaymentRepository {
  async findById(
    id: string,
    session?: ClientSession,
  ): Promise<PaymentDocument | null> {
    const q = PaymentModel.findById(id);
    if (session) q.session(session);
    return q.exec();
  }

  async findLeanById(id: string, session?: ClientSession) {
    const q = PaymentModel.findById(id).lean();
    if (session) q.session(session);
    return q.exec();
  }

  async create(
    payload: Record<string, unknown> | Array<Record<string, unknown>>,
    session?: ClientSession,
  ): Promise<PaymentDocument> {
    if (session) {
      const docs = await PaymentModel.create(
        Array.isArray(payload) ? payload : [payload],
        { session },
      );
      return docs[0];
    }
    const docs = await PaymentModel.create(
      Array.isArray(payload) ? payload : [payload],
    );
    return Array.isArray(payload) ? docs[0] : (docs as unknown as PaymentDocument);
  }

  async updateById(
    id: string,
    payload: Record<string, unknown>,
    session?: ClientSession,
  ): Promise<PaymentDocument | null> {
    const q = PaymentModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (session) q.session(session);
    return q.exec();
  }

  async count(filter: Record<string, unknown>) {
    return PaymentModel.countDocuments(filter).exec();
  }

  async list(filter: Record<string, unknown>) {
    return PaymentModel.find(filter).lean().exec();
  }
}
