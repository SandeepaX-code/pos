import { ClientSession } from "mongoose";
import { BranchModel } from "@/models/branch";
import type { BranchDocument } from "@/models/branch";

export class BranchRepository {
  async findById(
    id: string,
    session?: ClientSession,
  ): Promise<BranchDocument | null> {
    const q = BranchModel.findById(id);
    if (session) q.session(session);
    return q.exec();
  }

  async findLeanById(id: string, session?: ClientSession) {
    const q = BranchModel.findById(id).lean();
    if (session) q.session(session);
    return q.exec();
  }

  async findByCode(
    code: string,
    session?: ClientSession,
  ): Promise<BranchDocument | null> {
    const q = BranchModel.findOne({ code: code.toUpperCase() });
    if (session) q.session(session);
    return q.exec();
  }

  async create(
    payload: Record<string, unknown> | Array<Record<string, unknown>>,
    session?: ClientSession,
  ): Promise<BranchDocument> {
    if (session) {
      const docs = await BranchModel.create(
        Array.isArray(payload) ? payload : [payload],
        { session },
      );
      return docs[0];
    }
    const docs = await BranchModel.create(
      Array.isArray(payload) ? payload : [payload],
    );
    return Array.isArray(payload) ? docs[0] : (docs as unknown as BranchDocument);
  }

  async updateById(
    id: string,
    payload: Record<string, unknown>,
    session?: ClientSession,
  ): Promise<BranchDocument | null> {
    const q = BranchModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (session) q.session(session);
    return q.exec();
  }

  async deleteById(
    id: string,
    session?: ClientSession,
  ): Promise<BranchDocument | null> {
    const q = BranchModel.findByIdAndDelete(id);
    if (session) q.session(session);
    return q.exec();
  }

  async count(filter: Record<string, unknown>): Promise<number> {
    return BranchModel.countDocuments(filter).exec();
  }

  async list(filter: Record<string, unknown>) {
    return BranchModel.find(filter).lean().exec();
  }
}
