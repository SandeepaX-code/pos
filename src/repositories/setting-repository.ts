import { ClientSession } from "mongoose";
import { SettingModel } from "@/models/setting";
import type { SettingDocument } from "@/models/setting";

export class SettingRepository {
  async findById(
    id: string,
    session?: ClientSession,
  ): Promise<SettingDocument | null> {
    const q = SettingModel.findById(id);
    if (session) q.session(session);
    return q.exec();
  }

  async findLeanById(id: string, session?: ClientSession) {
    const q = SettingModel.findById(id).lean();
    if (session) q.session(session);
    return q.exec();
  }

  async findByKeyAndBranch(
    key: string,
    branchId?: string,
    session?: ClientSession,
  ): Promise<SettingDocument | null> {
    const query: Record<string, unknown> = { key };
    if (branchId) {
      query.branchId = branchId;
    } else {
      query.branchId = { $exists: false }; // Or null for global settings
    }
    const q = SettingModel.findOne(query);
    if (session) q.session(session);
    return q.exec();
  }

  async create(
    payload: Record<string, unknown> | Array<Record<string, unknown>>,
    session?: ClientSession,
  ): Promise<SettingDocument> {
    if (session) {
      const docs = await SettingModel.create(
        Array.isArray(payload) ? payload : [payload],
        { session },
      );
      return docs[0];
    }
    const docs = await SettingModel.create(
      Array.isArray(payload) ? payload : [payload],
    );
    return Array.isArray(payload) ? docs[0] : (docs as unknown as SettingDocument);
  }

  async updateById(
    id: string,
    payload: Record<string, unknown>,
    session?: ClientSession,
  ): Promise<SettingDocument | null> {
    const q = SettingModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (session) q.session(session);
    return q.exec();
  }

  async updateByKeyAndBranch(
    key: string,
    branchId: string | undefined,
    payload: Record<string, unknown>,
    session?: ClientSession,
  ): Promise<SettingDocument | null> {
    const query: Record<string, unknown> = { key };
    if (branchId) {
      query.branchId = branchId;
    } else {
      query.branchId = { $exists: false };
    }
    const q = SettingModel.findOneAndUpdate(query, payload, {
      new: true,
      upsert: true,
      runValidators: true,
    });
    if (session) q.session(session);
    return q.exec();
  }

  async deleteById(
    id: string,
    session?: ClientSession,
  ): Promise<SettingDocument | null> {
    const q = SettingModel.findByIdAndDelete(id);
    if (session) q.session(session);
    return q.exec();
  }

  async count(filter: Record<string, unknown>): Promise<number> {
    return SettingModel.countDocuments(filter).exec();
  }

  async list(filter: Record<string, unknown>) {
    return SettingModel.find(filter).lean().exec();
  }
}
