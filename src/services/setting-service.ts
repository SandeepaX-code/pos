import { connectToDatabase } from "@/lib/mongoose";
import { SettingRepository } from "@/repositories/setting-repository";
import type { AuthenticatedUser } from "@/lib/auth/auth";

export class SettingService {
  private readonly settings = new SettingRepository();

  private checkBranchAccess(actor: AuthenticatedUser, branchId?: string) {
    if (!branchId) {
      // Global settings can only be modified by superAdmin or admin
      if (actor.role !== "superAdmin" && actor.role !== "admin") {
        throw new Error("Access denied: Only administrators can modify global system settings.");
      }
    } else {
      // Branch specific settings
      if (actor.role !== "superAdmin" && actor.role !== "admin") {
        if (actor.branchId !== branchId) {
          throw new Error("Access denied: You cannot modify settings for another branch.");
        }
      }
    }
  }

  async getSetting(key: string, branchId?: string) {
    await connectToDatabase();
    
    // 1. Try to find branch-specific override
    if (branchId) {
      const branchSetting = await this.settings.findByKeyAndBranch(key, branchId);
      if (branchSetting) {
        return branchSetting;
      }
    }

    // 2. Fallback to global setting (branchId is undefined)
    const globalSetting = await this.settings.findByKeyAndBranch(key, undefined);
    if (!globalSetting) {
      throw new Error(`Setting with key "${key}" not found.`);
    }
    return globalSetting;
  }

  async listMergedSettings(actor: AuthenticatedUser, targetBranchId?: string) {
    await connectToDatabase();

    const branchId = actor.role === "superAdmin" || actor.role === "admin"
      ? targetBranchId
      : actor.branchId;

    const globalSettings = await this.settings.list({ branchId: { $exists: false } });
    const branchSettings = branchId
      ? await this.settings.list({ branchId })
      : [];

    const mergedMap = new Map<string, unknown>();
    
    for (const setting of globalSettings) {
      mergedMap.set(setting.key, setting);
    }
    
    for (const setting of branchSettings) {
      mergedMap.set(setting.key, setting);
    }

    return Array.from(mergedMap.values());
  }

  async setSetting(
    key: string,
    payload: { label: string; category: string; value: unknown; description?: string },
    actor: AuthenticatedUser,
    branchId?: string
  ) {
    await connectToDatabase();
    this.checkBranchAccess(actor, branchId);

    const updatePayload = {
      label: payload.label,
      category: payload.category,
      value: payload.value,
      description: payload.description,
      branchId: branchId || undefined,
      active: true,
    };

    return this.settings.updateByKeyAndBranch(key, branchId, updatePayload);
  }

  async deleteSetting(actor: AuthenticatedUser, id: string) {
    await connectToDatabase();
    
    const setting = await this.settings.findById(id);
    if (!setting) {
      throw new Error("Setting not found");
    }

    this.checkBranchAccess(actor, setting.branchId ? String(setting.branchId) : undefined);

    const deleted = await this.settings.deleteById(id);
    return deleted;
  }
}
