import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { UserModel } from "@/models/user";

export async function GET() {
  try {
    console.log("Connecting to database from route...");
    await connectToDatabase();
    console.log("Database connected successfully!");
    const count = await UserModel.countDocuments();
    return NextResponse.json({
      status: "connected",
      userCount: count,
      mongodbUri: process.env.MONGODB_URI ? "present" : "missing",
    });
  } catch (error: any) {
    console.error("Database connection error from route:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
        stack: error.stack,
        mongodbUri: process.env.MONGODB_URI ? "present" : "missing",
      },
      { status: 500 },
    );
  }
}
