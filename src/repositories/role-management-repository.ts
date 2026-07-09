import { Types } from "mongoose";

import { RoleModel } from "@/models/role";
import { UserModel } from "@/models/user";

export type RoleListFilter = {
  search?: string;
  active?: boolean;
};

export class RoleManagementRepository {
  async findById(id: string) {
    return RoleModel.findById(id).populate("permissions").exec();
  }

  async findLeanById(id: string) {
    return RoleModel.findById(id).populate("permissions").lean().exec();
  }

  async findByName(name: string) {
    return RoleModel.findOne({ name }).populate("permissions").exec();
  }

  async list(
    filter: RoleListFilter,
    pagination: { page: number; limit: number },
  ) {
    const query: Record<string, unknown> = {
      ...(filter.active === undefined ? {} : { active: filter.active }),
    };

    if (filter.search) {
      const search = filter.search.trim();
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { label: { $regex: search, $options: "i" } },
      ];
    }

    const total = await RoleModel.countDocuments(query).exec();
    const items = await RoleModel.find(query)
      .populate("permissions")
      .sort({ system: -1, createdAt: -1 })
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit)
      .lean()
      .exec();

    return { items, total };
  }

  async create(payload: Parameters<typeof RoleModel.create>[0]) {
    return RoleModel.create(payload);
  }

  async updateById(id: string, payload: Record<string, unknown>) {
    return RoleModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    })
      .populate("permissions")
      .exec();
  }

  async deleteById(id: string) {
    return RoleModel.findByIdAndDelete(id).populate("permissions").exec();
  }

  async count(filter: RoleListFilter) {
    const query: Record<string, unknown> = {
      ...(filter.active === undefined ? {} : { active: filter.active }),
    };

    if (filter.search) {
      const search = filter.search.trim();
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { label: { $regex: search, $options: "i" } },
      ];
    }

    return RoleModel.countDocuments(query).exec();
  }

  async countUsersByRoleId(roleId: string) {
    return UserModel.countDocuments({
      roleId: new Types.ObjectId(roleId),
    }).exec();
  }
}
