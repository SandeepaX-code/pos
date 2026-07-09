import { connectToDatabase } from "@/lib/mongoose";
import { SupplierRepository } from "@/repositories/supplier-repository";

export class SupplierService {
  private readonly suppliers = new SupplierRepository();

  async list(filter: Record<string, unknown> = {}) {
    await connectToDatabase();
    return this.suppliers.list(filter);
  }

  async getById(id: string) {
    await connectToDatabase();
    const supplier = await this.suppliers.findLeanById(id);
    if (!supplier) {
      throw new Error("Supplier not found");
    }
    return supplier;
  }

  async create(payload: Record<string, unknown>) {
    await connectToDatabase();
    if (payload.company && typeof payload.company === "string") {
      const existing = await this.suppliers.findByCompany(payload.company);
      if (existing) {
        throw new Error("Supplier company name must be unique");
      }
    }
    return this.suppliers.create(payload);
  }

  async update(id: string, payload: Record<string, unknown>) {
    await connectToDatabase();
    if (payload.company && typeof payload.company === "string") {
      const existing = await this.suppliers.findByCompany(payload.company);
      if (existing && String(existing._id) !== id) {
        throw new Error("Supplier company name must be unique");
      }
    }
    const updated = await this.suppliers.updateById(id, payload);
    if (!updated) {
      throw new Error("Supplier not found");
    }
    return updated;
  }

  async delete(id: string) {
    await connectToDatabase();
    const deleted = await this.suppliers.deleteById(id);
    if (!deleted) {
      throw new Error("Supplier not found");
    }
    return deleted;
  }
}
