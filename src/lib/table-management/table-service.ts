import mongoose from "mongoose";
import { RestaurantTableModel } from "@/models/restaurant-table";
import { ActivityLogModel } from "@/models/activity-log";
import type { TableRepository } from "@/lib/table-management/table-repository";
import type { TableSort } from "@/lib/table-management/table-repository";
import { withTransaction } from "@/lib/table-management/mongoose-transaction";
import { TableManagementError } from "@/lib/table-management/errors";
import {
  tableStatusFromApi,
  toTableApiModel,
} from "@/lib/table-management/mapper";

type TableModelStatus =
  | "available"
  | "occupied"
  | "reserved"
  | "cleaning"
  | "out_of_service";

export type AuthUser = {
  id: string;
  role: string;
  permissions: string[];
  branchId?: string;
};

export type TableCreateInput = {
  tableNumber: number;
  tableName: string;
  capacity: number;
  section: string;
  floor: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "CLEANING" | "OUT_OF_SERVICE";
  isActive: boolean;
};

export type TableUpdateInput = Partial<{
  tableNumber: number;
  tableName: string;
  capacity: number;
  section: string;
  floor: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "CLEANING" | "OUT_OF_SERVICE";
  isActive: boolean;
}>;

export type TableStatusAction =
  | "open"
  | "occupy"
  | "reserve"
  | "clean"
  | "close";

type ApiStatus =
  | "AVAILABLE"
  | "OCCUPIED"
  | "RESERVED"
  | "CLEANING"
  | "OUT_OF_SERVICE";

type ModelStatus =
  | "available"
  | "occupied"
  | "reserved"
  | "cleaning"
  | "out_of_service";

const ACTION_TO_NEXT_STATUS: Record<TableStatusAction, ModelStatus> = {
  open: "occupied",
  occupy: "occupied",
  reserve: "reserved",
  clean: "available",
  close: "out_of_service",
};

const STATUS_TRANSITIONS: Record<ModelStatus, Set<ModelStatus>> = {
  available: new Set(["occupied", "reserved", "out_of_service"]),
  occupied: new Set(["occupied", "cleaning", "out_of_service"]),
  reserved: new Set(["occupied", "out_of_service"]),
  cleaning: new Set(["available"]),
  out_of_service: new Set(["available"]),
};

export class TableService {
  constructor(private readonly tableRepository: TableRepository) {}

  async listTables(params: {
    filter: {
      search?: string;
      floor?: number;
      section?: string;
      status?: ApiStatus;
      isActive?: boolean;
      branchId?: string;
    };
    pagination: { page: number; pageSize: number };
    sort: TableSort;
  }) {
    const { results, total } = await this.tableRepository.list(
      params.filter,
      params.pagination,
      params.sort,
    );

    return {
      items: results.map((t) => toTableApiModel(t)),
      total,
      page: params.pagination.page,
      pageSize: params.pagination.pageSize,
    };
  }

  async getTable(id: string) {
    const table = await this.tableRepository.findById(id);
    if (!table || !table.isActive) {
      throw new TableManagementError("Table not found", "NOT_FOUND");
    }
    return toTableApiModel(table);
  }

  async createTable(input: TableCreateInput, user: AuthUser) {
    const payload = {
      tableNumber: input.tableNumber,
      label: input.tableName,
      seats: input.capacity,
      section: input.section,
      zone: input.section,
      floor: input.floor,
      status: tableStatusFromApi(input.status) as TableModelStatus,
      isActive: input.isActive,
      createdBy: new mongoose.Types.ObjectId(user.id),
      updatedBy: new mongoose.Types.ObjectId(user.id),
      branchId: user.branchId
        ? new mongoose.Types.ObjectId(user.branchId)
        : undefined,
    };

    const existing = await this.tableRepository.findUniqueByTableNumber(
      input.tableNumber,
    );
    if (existing) {
      throw new TableManagementError(
        "Table number must be unique",
        "CONFLICT",
        { tableNumber: input.tableNumber },
      );
    }

    const created = await this.tableRepository.create(payload);

    await ActivityLogModel.create({
      userId: new mongoose.Types.ObjectId(user.id),
      userName: user.id,
      action: "create_table",
      entity: "Table",
      entityId: created._id,
      branchId: created.branchId,
      metadata: {
        tableNumber: created.tableNumber,
        status: created.status,
      },
    });

    return toTableApiModel(created);
  }

  async updateTable(id: string, input: TableUpdateInput, user: AuthUser) {
    const existing = await this.tableRepository.findById(id);
    if (!existing)
      throw new TableManagementError("Table not found", "NOT_FOUND");

    if (
      input.tableNumber !== undefined &&
      input.tableNumber !== existing.tableNumber
    ) {
      const dup = await this.tableRepository.findUniqueByTableNumber(
        input.tableNumber,
      );
      if (dup && String(dup._id) !== id) {
        throw new TableManagementError(
          "Table number must be unique",
          "CONFLICT",
          { tableNumber: input.tableNumber },
        );
      }
    }

    const update: Partial<typeof existing> = {
      ...(input.tableNumber !== undefined
        ? { tableNumber: input.tableNumber }
        : {}),
      ...(input.tableName !== undefined ? { label: input.tableName } : {}),
      ...(input.capacity !== undefined ? { seats: input.capacity } : {}),
      ...(input.section !== undefined
        ? { section: input.section, zone: input.section }
        : {}),
      ...(input.floor !== undefined ? { floor: input.floor } : {}),
      ...(input.status !== undefined
        ? { status: tableStatusFromApi(input.status) }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      updatedBy: new mongoose.Types.ObjectId(user.id),
    };

    const updated = await this.tableRepository.updateById(id, update);
    if (!updated)
      throw new TableManagementError("Table not found", "NOT_FOUND");

    await ActivityLogModel.create({
      userId: new mongoose.Types.ObjectId(user.id),
      userName: user.id,
      action: "update_table",
      entity: "Table",
      entityId: updated._id,
      branchId: updated.branchId,
      metadata: {
        tableNumber: updated.tableNumber,
        status: updated.status,
      },
    });

    return toTableApiModel(updated);
  }

  async deleteTable(id: string, user: AuthUser) {
    const deleted = await this.tableRepository.deleteById(id);
    if (!deleted)
      throw new TableManagementError("Table not found", "NOT_FOUND");

    await ActivityLogModel.create({
      userId: new mongoose.Types.ObjectId(user.id),
      userName: user.id,
      action: "delete_table",
      entity: "Table",
      entityId: deleted._id,
      branchId: deleted.branchId,
      metadata: { tableNumber: deleted.tableNumber },
    });

    return toTableApiModel(deleted);
  }

  async changeStatus(params: {
    id: string;
    action: TableStatusAction;
    user: AuthUser;
  }) {
    return withTransaction(async (session) => {
      const table = await RestaurantTableModel.findById(params.id).session(
        session,
      );
      if (!table || !table.isActive)
        throw new TableManagementError("Table not found", "NOT_FOUND");

      const from = table.status as ModelStatus;
      const directTo = ACTION_TO_NEXT_STATUS[params.action];

      // enforce transitions + cleaning intermediate when requested from occupied
      let next: ModelStatus = directTo;
      if (params.action === "clean") {
        if (from === "occupied") next = "cleaning";
        else if (from === "cleaning") next = "available";
        else if (from === "available" || from === "reserved") {
          // clean is only valid from occupied/cleaning in spec
          throw new TableManagementError(
            "Invalid table status transition",
            "INVALID_TRANSITION",
          );
        }
      }

      const allowed = STATUS_TRANSITIONS[from].has(next);
      if (!allowed) {
        throw new TableManagementError(
          "Invalid table status transition",
          "INVALID_TRANSITION",
        );
      }

      table.status = next;
      table.updatedBy = new mongoose.Types.ObjectId(params.user.id);

      await table.save({ session });

      await ActivityLogModel.create({
        userId: new mongoose.Types.ObjectId(params.user.id),
        userName: params.user.id,
        action: `table_${params.action}`,
        entity: "Table",
        entityId: table._id,
        branchId: table.branchId,
        metadata: { from, to: next },
      });

      return toTableApiModel(table);
    });
  }
}
