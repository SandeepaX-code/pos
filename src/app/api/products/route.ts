import { NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongoose";
import { ProductModel, type ProductDocument } from "@/models/product";
import { jsonSuccess, jsonError } from "@/utils/http";
import { Types } from "mongoose";

type ProductLeanPopulated = Partial<ProductDocument> & {
  _id?: Types.ObjectId;
  categoryId?: { _id?: Types.ObjectId; name?: string; slug?: string } | Types.ObjectId;
};

const listQuerySchema = z.object({
  search: z.string().max(160).optional(),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  available: z.coerce.boolean().default(true),
  sortBy: z.enum(["name", "price", "stock", "createdAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const GET = async (req: NextRequest) => {
  try {
    const parsed = listQuerySchema.safeParse(
      Object.fromEntries(new URL(req.url).searchParams),
    );

    if (!parsed.success) {
      return jsonError(400, "Invalid query parameters", "VALIDATION_ERROR", {
        errors: parsed.error.flatten(),
      });
    }

    await connectToDatabase();

    const { search, categoryId, available, sortBy, sortOrder, page, limit } =
      parsed.data;

    const filter: Record<string, unknown> = { available };

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const direction = sortOrder === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      ProductModel.find(filter)
        .select("name sku categoryId image price variants addons stock")
        .sort({ [sortBy]: direction })
        .skip(skip)
        .limit(limit)
        .populate("categoryId", "name slug")
        .lean()
        .exec(),
      ProductModel.countDocuments(filter),
    ]);

    const formatted = items.map((item: ProductLeanPopulated) => {
      let categoryId = "";
      let categoryName: string | undefined;

      if (item.categoryId instanceof Types.ObjectId) {
        categoryId = String(item.categoryId);
      } else if (typeof item.categoryId === "object" && item.categoryId !== null) {
        const catRef = item.categoryId as { _id?: Types.ObjectId; name?: string };
        categoryId = String(catRef._id || item.categoryId);
        categoryName = catRef.name;
      }

      return {
        id: String(item._id),
        name: item.name || "",
        sku: item.sku || "",
        categoryId,
        categoryName,
        image: item.image || "",
        price: item.price ?? 0,
        variants: item.variants || [],
        addons: item.addons || [],
        available: (item.stock ?? 0) > 0,
      };
    });

    return jsonSuccess(
      {
        items: formatted,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      200,
      "Products retrieved",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list products";
    return jsonError(500, message, "INTERNAL_ERROR");
  }
};
