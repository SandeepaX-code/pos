import { RestaurantTableModel } from "@/models/restaurant-table";
import type { RestaurantTableDocument } from "@/models/restaurant-table";
import type mongoose from "mongoose";

export type TableListFilter = {
  search?: string;
  floor?: number;
  section?: string;
  status?: string;
  isActive?: boolean;
  branchId?: mongoose.Types.ObjectId | string;
};

export type TableSort = {
  sortBy?:
    | "tableNumber"
    | "tableName"
    | "capacity"
    | "floor"
    | "section"
    | "createdAt"
    | "updatedAt";
  sortOrder?: "asc" | "desc";
};

export class TableRepository {
  async findById(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<RestaurantTableDocument | null> {
    const q = RestaurantTableModel.findById(id);
    if (session) q.session(session);
    return q.exec();
  }

  async findUniqueByTableNumber(
    tableNumber: number,
    session?: mongoose.ClientSession,
  ): Promise<RestaurantTableDocument | null> {
    const q = RestaurantTableModel.findOne({ tableNumber });
    if (session) q.session(session);
    return q.exec();
  }

  async create(
    payload: Partial<RestaurantTableDocument> | Record<string, unknown>,
    session?: mongoose.ClientSession,
  ): Promise<RestaurantTableDocument> {
    const doc = new RestaurantTableModel(payload);
    if (session) {
      doc.$session(session);
    }
    return doc.save();
  }

  async updateById(
    id: string,
    payload: Partial<RestaurantTableDocument> | Record<string, unknown>,
    session?: mongoose.ClientSession,
  ): Promise<RestaurantTableDocument | null> {
    const q = RestaurantTableModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (session) q.session(session);
    return q.exec();
  }

  async deleteById(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<RestaurantTableDocument | null> {
    const q = RestaurantTableModel.findByIdAndDelete(id);
    if (session) q.session(session);
    return q.exec();
  }

  async list(
    filter: TableListFilter,
    pagination: { page: number; pageSize: number },
    sort: TableSort,
    session?: mongoose.ClientSession,
  ): Promise<{ results: RestaurantTableDocument[]; total: number }> {
    const page = pagination.page;
    const pageSize = pagination.pageSize;

    const query: Record<string, unknown> = {
      ...(filter.isActive === undefined ? {} : { isActive: filter.isActive }),
      ...(filter.branchId ? { branchId: filter.branchId } : {}),
      ...(filter.floor !== undefined ? { floor: filter.floor } : {}),
      ...(filter.section ? { section: filter.section } : {}),
      ...(filter.status ? { status: filter.status } : {}),
    };

    if (filter.search) {
      const s = filter.search.trim();
      query["$or"] = [
        { tableNumber: { $regex: s, $options: "i" } },
        { label: { $regex: s, $options: "i" } },
        { zone: { $regex: s, $options: "i" } },
        { section: { $regex: s, $options: "i" } },
      ];
    }

    const sortFieldMap: Record<string, string> = {
      tableNumber: "tableNumber",
      tableName: "label",
      capacity: "seats",
      floor: "floor",
      section: "section",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    };

    const sortBy = sort.sortBy ? sortFieldMap[sort.sortBy] : "tableNumber";
    const sortOrder = sort.sortOrder === "desc" ? -1 : 1;

    const total = session
      ? await RestaurantTableModel.countDocuments(query).session(session)
      : await RestaurantTableModel.countDocuments(query);

    const q = RestaurantTableModel.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    if (session) q.session(session);

    const results = await q.exec();
    return { results, total };
  }
}
