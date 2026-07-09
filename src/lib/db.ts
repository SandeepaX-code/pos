import { connectToDatabase } from "@/lib/mongoose";

export async function ensureDb() {
  await connectToDatabase();
  return true;
}
