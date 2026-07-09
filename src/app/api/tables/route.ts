import { NextResponse } from "next/server";

import { TableRepository } from "@/repositories/table-repository";
import { TableService } from "@/services/table-service";
import { connectToDatabase } from "@/lib/mongoose";
import {
  tableCreateSchema,
  tableListQuerySchema,
} from "@/validation/table-management";
import { jsonError, jsonSuccess } from "@/utils/http";
import { requireAuth, requirePermission } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";

export const GET = requireAuth(async (req) => {
  const denied = await requirePermission("tables.view")(req);
  if (denied) return denied;

  try {
    await connectToDatabase();

    const query = tableListQuerySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams.entries()),
    );

    const service = new TableService(new TableRepository());
    const data = await service.listTables({
      filter: {
        search: query.search,
        floor: query.floor,
        section: query.section,
        status: query.status,
        isActive: true,
        branchId: req.user?.branchId,
      },
      pagination: { page: query.page, pageSize: query.pageSize },
      sort: { sortBy: query.sortBy, sortOrder: query.sortOrder },
    });

    return NextResponse.json({ success: true, data });
  } catch {
    return jsonError(400, "Invalid request", "VALIDATION_ERROR");
  }
});

export const POST = requireAuth(async (req) => {
  const denied = await requirePermission("tables.manage")(req);
  if (denied) return denied;

  try {
    await connectToDatabase();

    const body = tableCreateSchema.parse(await req.json());
    const service = new TableService(new TableRepository());
    const data = await service.createTable(body, req.user!);
    return jsonSuccess(data, 201);
  } catch {
    return jsonError(400, "Invalid request", "VALIDATION_ERROR");
  }
});

export const PUT = requireAuth(async () => {
  return jsonError(405, "Method not allowed", "INTERNAL_ERROR");
});

export const DELETE = requireAuth(async () => {
  return jsonError(405, "Method not allowed", "INTERNAL_ERROR");
});
