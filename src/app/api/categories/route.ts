import { NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongoose";
import { CategoryModel } from "@/models/category";
import { jsonSuccess, jsonError } from "@/utils/http";

const listQuerySchema = z.object({
  active: z.coerce.boolean().default(true),
  sortBy: z.enum(["name", "sortOrder", "createdAt"]).default("sortOrder"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
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

    const { active, sortBy, sortOrder } = parsed.data;
    const direction = sortOrder === "asc" ? 1 : -1;

    const categories = await CategoryModel.find({ active })
      .sort({ [sortBy]: direction })
      .lean()
      .exec();

    const formatted = categories.map((cat) => ({
      id: String(cat._id),
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      image: cat.image,
      color: cat.color,
      sortOrder: cat.sortOrder,
    }));

    return jsonSuccess(formatted, 200, "Categories retrieved");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list categories";
    return jsonError(500, message, "INTERNAL_ERROR");
  }
};
