import { ClientSession } from "mongoose";
import { SupplierModel } from "@/models/supplier";
import type { SupplierDocument } from "@/models/supplier";

export class SupplierRepository {
  async findById(
    id: string,
    session?: ClientSession,
  ): Promise<SupplierDocument | null> {
    const q = SupplierModel.findById(id);
    if (session) q.session(session);
    return q.exec();
  }

  async findLeanById(id: string, session?: ClientSession) {
    const q = SupplierModel.findById(id).lean();
    if (session) q.session(session);
    return q.exec();
  }

  async findByCompany(
    company: string,
    session?: ClientSession,
  ): Promise<SupplierDocument | null> {
    const q = SupplierModel.findOne({ company });
    if (session) q.session(session);
    return q.exec();
  }

  async create(
    payload: Record<string, unknown> | Array<Record<string, unknown>>,
    session?: ClientSession,
  ): Promise<SupplierDocument> {
    if (session) {
      const docs = await SupplierModel.create(
        Array.isArray(payload) ? payload : [payload],
        { session },
      );
      return docs[0];
    }
    const docs = await SupplierModel.create(
      Array.isArray(payload) ? payload : [payload],
    );
    return Array.isArray(payload)
      ? docs[0]
      : (docs as unknown as SupplierDocument);
  }

  async updateById(
    id: string,
    payload: Record<string, unknown>,
    session?: ClientSession,
  ): Promise<SupplierDocument | null> {
    const q = SupplierModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (session) q.session(session);
    return q.exec();
  }

  async deleteById(
    id: string,
    session?: ClientSession,
  ): Promise<SupplierDocument | null> {
    const q = SupplierModel.findByIdAndDelete(id);
    if (session) q.session(session);
    return q.exec();
  }

  async list(filter: Record<string, unknown> = {}) {
    return SupplierModel.find(filter).lean().exec();
  }

  async count(filter: Record<string, unknown> = {}) {
    return SupplierModel.countDocuments(filter).exec();
  }
}
