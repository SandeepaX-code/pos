import { PermissionRepository } from "@/repositories/permission-repository";
import { connectToDatabase } from "@/lib/mongoose";

export class PermissionService {
  private readonly permissions = new PermissionRepository();

  async listPermissions(input: {
    search?: string;
    group?: string;
    page: number;
    limit: number;
  }) {
    await connectToDatabase();
    const { items, total } = await this.permissions.list(
      { search: input.search, group: input.group },
      { page: input.page, limit: input.limit },
    );
    return {
      items: items.map((p) => ({
        id: String(p._id),
        key: p.key,
        label: p.label,
        description: p.description,
        group: p.group,
      })),
      total,
      page: input.page,
      limit: input.limit,
      totalPages: Math.max(1, Math.ceil(total / input.limit)),
    };
  }

  async getPermission(id: string) {
    await connectToDatabase();
    const p = await this.permissions.findById(id);
    if (!p) {
      throw Object.assign(new Error("Permission not found"), {
        code: "NOT_FOUND" as const,
      });
    }
    return {
      id: String(p._id),
      key: p.key,
      label: p.label,
      description: p.description,
      group: p.group,
    };
  }
}
