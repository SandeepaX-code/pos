import { NextRequest } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth/auth";
import { SettingService } from "@/services/setting-service";
import { jsonError, jsonSuccess } from "@/utils/http";

export const dynamic = "force-dynamic";

export const GET = requireAuth(async (req) => {
  const denied = await requirePermission("settings.manage")(req);
  if (denied) return denied;

  try {
    const url = new URL(req.url);
    const targetBranchId = url.searchParams.get("branchId") || undefined;

    const service = new SettingService();
    const settings = await service.listMergedSettings(req.user!, targetBranchId);
    return jsonSuccess(settings, 200, "Settings retrieved");
  } catch (e: unknown) {
    return jsonError(500, (e as Error).message || "Failed to retrieve settings", "INTERNAL_ERROR");
  }
});

export const POST = requireAuth(async (req) => {
  const denied = await requirePermission("settings.manage")(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const service = new SettingService();

    // Support single setting or bulk setting payload
    if (Array.isArray(body)) {
      const results = [];
      for (const item of body) {
        if (!item.key || !item.label || !item.category || item.value === undefined) {
          throw new Error("Missing required fields (key, label, category, value) in bulk item.");
        }
        const updated = await service.setSetting(
          item.key,
          {
            label: item.label,
            category: item.category,
            value: item.value,
            description: item.description,
          },
          req.user!,
          item.branchId
        );
        results.push(updated);
      }
      return jsonSuccess(results, 200, "Bulk settings updated");
    } else {
      if (!body.key || !body.label || !body.category || body.value === undefined) {
        return jsonError(400, "Missing required fields (key, label, category, value)", "VALIDATION_ERROR");
      }
      const updated = await service.setSetting(
        body.key,
        {
          label: body.label,
          category: body.category,
          value: body.value,
          description: body.description,
        },
        req.user!,
        body.branchId
      );
      return jsonSuccess(updated, 200, "Setting updated");
    }
  } catch (e: unknown) {
    return jsonError(400, (e as Error).message || "Failed to save settings", "VALIDATION_ERROR");
  }
});
