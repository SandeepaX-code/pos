import { connectToDatabase } from "@/lib/mongoose";
import { BranchRepository } from "@/repositories/branch-repository";
import type { AuthenticatedUser } from "@/lib/auth/auth";

export class BranchService {
  private readonly branches = new BranchRepository();

  private checkBranchAccess(actor: AuthenticatedUser, branchId: string) {
    if (actor.role !== "superAdmin" && actor.role !== "admin") {
      if (actor.branchId !== branchId) {
        throw new Error("Access denied: You are not authorized to view or modify this branch.");
      }
    }
  }

  async list(actor: AuthenticatedUser, filter: Record<string, unknown> = {}) {
    await connectToDatabase();
    
    // If not superAdmin or admin, strictly isolate data to their own branch
    if (actor.role !== "superAdmin" && actor.role !== "admin") {
      filter._id = actor.branchId;
    }
    
    return this.branches.list(filter);
  }

  async getById(actor: AuthenticatedUser, id: string) {
    await connectToDatabase();
    this.checkBranchAccess(actor, id);
    
    const branch = await this.branches.findLeanById(id);
    if (!branch) {
      throw new Error("Branch not found");
    }
    return branch;
  }

  async create(actor: AuthenticatedUser, payload: Record<string, unknown>) {
    await connectToDatabase();
    
    // Only superAdmin or admin can create new branches
    if (actor.role !== "superAdmin" && actor.role !== "admin") {
      throw new Error("Access denied: Only administrators can create branches.");
    }

    if (payload.code && typeof payload.code === "string") {
      const existing = await this.branches.findByCode(payload.code);
      if (existing) {
        throw new Error(`Branch with code "${payload.code}" already exists.`);
      }
    }

    return this.branches.create(payload);
  }

  async update(actor: AuthenticatedUser, id: string, payload: Record<string, unknown>) {
    await connectToDatabase();
    this.checkBranchAccess(actor, id);

    if (payload.code && typeof payload.code === "string") {
      const existing = await this.branches.findByCode(payload.code);
      if (existing && String(existing._id) !== id) {
        throw new Error(`Branch with code "${payload.code}" already exists.`);
      }
    }

    const updated = await this.branches.updateById(id, payload);
    if (!updated) {
      throw new Error("Branch not found");
    }
    return updated;
  }

  async delete(actor: AuthenticatedUser, id: string) {
    await connectToDatabase();
    
    // Deleting a branch is restricted to superAdmin/admin
    if (actor.role !== "superAdmin" && actor.role !== "admin") {
      throw new Error("Access denied: Only administrators can delete branches.");
    }

    const deleted = await this.branches.deleteById(id);
    if (!deleted) {
      throw new Error("Branch not found");
    }
    return deleted;
  }
}
