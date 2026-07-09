import { ClientSession } from "mongoose";
import { BillModel } from "@/models/bill";
import type { BillDocument } from "@/models/bill";

export class BillRepository {
  async findById(
    id: string,
    session?: ClientSession,
  ): Promise<BillDocument | null> {
    const q = BillModel.findById(id);
    if (session) q.session(session);
    return q.exec();
  }

  async findLeanById(id: string, session?: ClientSession) {
    const q = BillModel.findById(id).lean();
    if (session) q.session(session);
    return q.exec();
  }

  async findByInvoiceNumber(
    invoiceNumber: string,
    session?: ClientSession,
  ): Promise<BillDocument | null> {
    const q = BillModel.findOne({ invoiceNumber });
    if (session) q.session(session);
    return q.exec();
  }

  async create(
    payload: Record<string, unknown> | Array<Record<string, unknown>>,
    session?: ClientSession,
  ): Promise<BillDocument> {
    if (session) {
      const docs = await BillModel.create(
        Array.isArray(payload) ? payload : [payload],
        { session },
      );
      return docs[0];
    }
    const docs = await BillModel.create(
      Array.isArray(payload) ? payload : [payload],
    );
    return Array.isArray(payload) ? docs[0] : (docs as unknown as BillDocument);
  }

  async updateById(
    id: string,
    payload: Record<string, unknown>,
    session?: ClientSession,
  ): Promise<BillDocument | null> {
    const q = BillModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (session) q.session(session);
    return q.exec();
  }

  async count(filter: Record<string, unknown>) {
    return BillModel.countDocuments(filter).exec();
  }

  async list(filter: Record<string, unknown>) {
    return BillModel.find(filter).lean().exec();
  }
}
