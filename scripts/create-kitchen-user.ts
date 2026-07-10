import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "../src/lib/mongoose";
import { UserModel } from "../src/models/user";
import { BranchModel } from "../src/models/branch";

async function run() {
  await connectToDatabase();
  console.log("Connected to database.");

  // Find Central Colombo branch or first branch
  const branch = await BranchModel.findOne({ code: "branch-central" }).exec() 
    || await BranchModel.findOne().exec();

  if (!branch) {
    console.error("No branch found to assign kitchen user.");
    process.exit(1);
  }

  const username = "kitchen1";
  const existing = await UserModel.findOne({ username }).exec();
  if (existing) {
    console.log(`Kitchen user '${username}' already exists.`);
    process.exit(0);
  }

  const defaultPasswordHash = await bcrypt.hash("Password123!", 12);
  const kitchenUser = await UserModel.create({
    fullName: "Ruwan Silva",
    username,
    email: "kitchen@aurumbistro.com",
    phone: "+94 77 345 6789",
    role: "kitchenStaff",
    branchId: branch._id,
    active: true,
    passwordHash: defaultPasswordHash,
  });

  console.log("Kitchen user created successfully:", kitchenUser);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
