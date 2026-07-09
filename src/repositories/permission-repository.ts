import { PermissionModel } from "@/models/permission";

export type PermissionListFilter = {
  search?: string;
  group?: string;
};

export class PermissionRepository {
  async findById(id: string) {
    return PermissionModel.findById(id).exec();
  }

  async findByKey(key: string) {
    return PermissionModel.findOne({ key }).exec();
  }

  async list(
    filter: PermissionListFilter,
    pagination: { page: number; limit: number },
  ) {
    const query: Record<string, unknown> = {};

    if (filter.group) {
      query.group = filter.group;
    }

    if (filter.search) {
      const search = filter.search.trim();
      query.$or = [
        { key: { $regex: search, $options: "i" } },
        { label: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const total = await PermissionModel.countDocuments(query).exec();
    const items = await PermissionModel.find(query)
      .sort({ group: 1, key: 1 })
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit)
      .lean()
      .exec();

    return { items, total };
  }

  async create(payload: Parameters<typeof PermissionModel.create>[0]) {
    return PermissionModel.create(payload);
  }

  async updateById(id: string, payload: Record<string, unknown>) {
    return PermissionModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).exec();
  }

  async deleteById(id: string) {
    return PermissionModel.findByIdAndDelete(id).exec();
  }

  async listAll() {
    return PermissionModel.find({}).sort({ group: 1, key: 1 }).lean().exec();
  }
}
