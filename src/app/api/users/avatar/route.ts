import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { jsonError, jsonSuccess } from "@/utils/http";
import { requireAuth } from "@/lib/auth/auth";

export const POST = requireAuth(async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || typeof file === "string") {
      return jsonError(400, "No file uploaded", "VALIDATION_ERROR");
    }

    if (typeof file.arrayBuffer !== "function") {
      return jsonError(400, "Invalid file format", "VALIDATION_ERROR");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return jsonError(
        400,
        "Only JPEG, PNG, GIF, and WEBP image files are allowed",
        "VALIDATION_ERROR",
      );
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return jsonError(
        400,
        "File size exceeds 5MB limit",
        "VALIDATION_ERROR",
      );
    }

    const fileExtension = file.name.split(".").pop() || "png";
    const filename = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}.${fileExtension}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const relativeUrl = `/uploads/avatars/${filename}`;

    return jsonSuccess(
      { url: relativeUrl },
      201,
      "Avatar uploaded successfully",
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload avatar";
    return jsonError(500, message, "INTERNAL_ERROR");
  }
});
