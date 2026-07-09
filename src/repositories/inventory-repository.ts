import { ClientSession, Types } from "mongoose";
import { InventoryModel } from "@/models/inventory";

export class InventoryRepository {
  async findById(id: string, session?: ClientSession) {
    const query = InventoryModel.findById(id);
    if (session) {
      query.session(session);
    }
    return query.exec();
  }

  async findLeanById(id: string, session?: ClientSession) {
    const query = InventoryModel.findById(id).lean();
    if (session) {
      query.session(session);
    }
    return query.exec();
  }

  async findOne(
    queryFilter: Record<string, unknown>,
    session?: ClientSession,
  ) {
    const query = InventoryModel.findOne(queryFilter);
    if (session) {
      query.session(session);
    }
    return query.exec();
  }

  async findLeanOne(
    queryFilter: Record<string, unknown>,
    session?: ClientSession,
  ) {
    const query = InventoryModel.findOne(queryFilter).lean();
    if (session) {
      query.session(session);
    }
    return query.exec();
  }

  async create(
    payload: Parameters<typeof InventoryModel.create>[0],
    session?: ClientSession,
  ) {
    if (session) {
      const docs = await InventoryModel.create([payload], { session });
      return docs[0];
    }
    return InventoryModel.create(payload);
  }

  async updateById(
    id: string,
    payload: Record<string, unknown>,
    session?: ClientSession,
  ) {
    const query = InventoryModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (session) {
      query.session(session);
    }
    return query.exec();
  }

  async updateStockWithSession(
    id: string,
    quantity: number,
    session: ClientSession,
  ) {
    return InventoryModel.findByIdAndUpdate(
      id,
      {
        $set: {
          stockOnHand: Math.max(0, quantity),
          lastCountedAt: new Date(),
        },
      },
      { new: true, runValidators: true },
    )
      .session(session)
      .exec();
  }

  async count(filter: Record<string, unknown>) {
    return InventoryModel.countDocuments(filter).exec();
  }

  async list(filter: Record<string, unknown>) {
    return InventoryModel.find(filter).lean().exec();
  }
}
