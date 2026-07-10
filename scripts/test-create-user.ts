import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "../src/lib/mongoose";
import { UserModel } from "../src/models/user";
import { BranchModel } from "../src/models/branch";

async function run() {
  await connectToDatabase();
  console.log("Connected to database.");

  const branch = await BranchModel.findOne().exec();
  if (!branch) {
    console.error("No branch found.");
    process.exit(1);
  }

  const uniqueSuffix = Date.now().toString().slice(-4);
  const payload = {
    fullName: "Test User",
    username: `testuser${uniqueSuffix}`,
    email: `testuser${uniqueSuffix}@example.com`,
    phone: "+94771234567",
    role: "cashier",
    branchId: String(branch._id),
    password: "Password123!",
    active: true,
  };

  try {
    console.log("Attempting UserModel.create...");
    const user = await UserModel.create({
      ...payload,
      passwordHash: await bcrypt.hash(payload.password, 12),
    });
    console.log("User created successfully:", user);
    
    // Clean up
    await UserModel.findByIdAndDelete(user._id);
    console.log("Test user cleaned up.");
  } catch (err) {
    console.error("UserModel.create failed with error:", err);
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
