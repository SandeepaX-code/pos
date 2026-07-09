import { Types } from "mongoose";

import { UserModel } from "@/models/user";

type UserQuery = {
  search?: string;
  roleId?: string;
  role?: string;
  branchId?: string;
  active?: boolean;
  includeDeleted?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type UserListResult<T> = {
  items: T[];
  total: number;
};

export class UserRepository {
  private buildFilter(query: UserQuery) {
    const filter: Record<string, unknown> & {
      $or?: Array<Record<string, unknown>>;
    } = {
      ...(query.includeDeleted ? {} : { deletedAt: null }),
      ...(query.active === undefined ? {} : { active: query.active }),
      ...(query.roleId ? { roleId: new Types.ObjectId(query.roleId) } : {}),
      ...(query.role ? { role: query.role } : {}),
      ...(query.branchId
        ? { branchId: new Types.ObjectId(query.branchId) }
        : {}),
    };

    if (query.search) {
      const search = query.search.trim();
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    return filter;
  }

  private buildSort(sortBy?: string, sortOrder?: "asc" | "desc") {
    const direction = sortOrder === "asc" ? 1 : -1;
    const field = sortBy ?? "createdAt";
    return { [field]: direction };
  }

  async findById(id: string, includeDeleted = false) {
    const filter = includeDeleted
      ? { _id: id }
      : { _id: id, deletedAt: null };
    return UserModel.findOne(filter).populate("roleId").exec();
  }

  async findLeanById(id: string, includeDeleted = false) {
    const filter = includeDeleted
      ? { _id: id }
      : { _id: id, deletedAt: null };
    return UserModel.findOne(filter)
      .populate("roleId")
      .populate("branchId")
      .lean()
      .exec();
  }

  async findByUsername(username: string) {
    return UserModel.findOne({ username, deletedAt: null })
      .select("_id username")
      .lean()
      .exec();
  }

  async findByEmail(email: string) {
    return UserModel.findOne({ email, deletedAt: null })
      .select("_id email")
      .lean()
      .exec();
  }

  async findByIdWithSecrets(id: string) {
    return UserModel.findOne({ _id: id, deletedAt: null }).select(
      "+passwordHash +previousPasswordHash fullName username email phone role roleId branchId active avatar lastLoginAt mustChangePassword deletedAt",
    );
  }

  async findByUsernameIncludingInactive(username: string) {
    return UserModel.findOne({ username, deletedAt: null })
      .select(
        "+passwordHash fullName username email phone role roleId branchId active avatar lastLoginAt mustChangePassword deletedAt",
      )
      .exec();
  }

  async list(
    query: UserQuery,
    pagination: { page: number; limit: number },
  ): Promise<
    UserListResult<
      Awaited<ReturnType<typeof UserModel.find>> extends never ? never : unknown
    >
  > {
    const filter = this.buildFilter(query);
    const sort = this.buildSort(query.sortBy, query.sortOrder);

    const total = await UserModel.countDocuments(filter as never).exec();
    const items = await UserModel.find(filter as never)
      .populate("roleId")
      .sort(sort as never)
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit)
      .lean()
      .exec();

    return { items, total };
  }

  async create(payload: Parameters<typeof UserModel.create>[0]) {
    return UserModel.create(payload);
  }

  async updateById(id: string, payload: Record<string, unknown>) {
    return UserModel.findOneAndUpdate({ _id: id, deletedAt: null }, payload, {
      new: true,
      runValidators: true,
    })
      .populate("roleId")
      .exec();
  }

  async softDeleteById(id: string, deletedBy: string) {
    return UserModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        $set: {
          active: false,
          deletedAt: new Date(),
          deletedBy: new Types.ObjectId(deletedBy),
        },
      },
      { new: true, runValidators: true },
    )
      .populate("roleId")
      .exec();
  }

  async setActiveStatus(id: string, active: boolean) {
    return UserModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { active } },
      { new: true, runValidators: true },
    )
      .populate("roleId")
      .exec();
  }

  async resetPassword(
    id: string,
    passwordHash: string,
    mustChangePassword: boolean,
  ) {
    const user = await UserModel.findOne({ _id: id, deletedAt: null }).select(
      "+passwordHash +previousPasswordHash",
    );
    if (!user) {
      return null;
    }

    user.previousPasswordHash = user.passwordHash;
    user.passwordHash = passwordHash;
    user.mustChangePassword = mustChangePassword;
    await user.save();
    return user;
  }

  async changePassword(
    id: string,
    newPasswordHash: string,
    previousPasswordHash: string,
  ) {
    const user = await UserModel.findOne({ _id: id, deletedAt: null }).select(
      "+passwordHash +previousPasswordHash",
    );
    if (!user) {
      return null;
    }

    user.previousPasswordHash = previousPasswordHash;
    user.passwordHash = newPasswordHash;
    user.mustChangePassword = false;
    await user.save();
    return user;
  }

  async count(query: UserQuery) {
    const filter = this.buildFilter(query);
    return UserModel.countDocuments(filter as never).exec();
  }

  async countByRoleId(roleId: string) {
    return UserModel.countDocuments({
      roleId: new Types.ObjectId(roleId),
      deletedAt: null,
    }).exec();
  }
}
