import { NextRequest } from "next/server";
import { TableRepository } from "@/repositories/table-repository";
import { TableService } from "@/services/table-service";
import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { jsonError, jsonSuccess } from "@/utils/http";
import { connectToDatabase } from "@/lib/mongoose";
import {
  tableIdParamSchema,
  tableUpdateSchema,
} from "@/validation/table-management";

export const dynamic = "force-dynamic";

export const GET = requireAuth(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("tables.view")(req);
    if (denied) return denied;

    try {
      await connectToDatabase();
      const { id } = tableIdParamSchema.parse(await params);
      const service = new TableService(new TableRepository());
      const data = await service.getTable(id);
      return jsonSuccess(data);
    } catch {
      return jsonError(404, "Table not found", "NOT_FOUND");
    }
  },
);

export const PUT = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("tables.manage")(req);
    if (denied) return denied;

    try {
      await connectToDatabase();
      const { id } = tableIdParamSchema.parse(await params);
      const body = tableUpdateSchema.parse(await req.json());
      const service = new TableService(new TableRepository());
      const data = await service.updateTable(id, body, req.user!);
      return jsonSuccess(data);
    } catch {
      return jsonError(400, "Invalid request", "VALIDATION_ERROR");
    }
  },
);

export const DELETE = requireAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const denied = await requirePermission("tables.manage")(req);
    if (denied) return denied;

    try {
      await connectToDatabase();
      const { id } = tableIdParamSchema.parse(await params);
      const service = new TableService(new TableRepository());
      const data = await service.deleteTable(id, req.user!);
      return jsonSuccess(data);
    } catch {
      return jsonError(404, "Table not found", "NOT_FOUND");
    }
  },
);
