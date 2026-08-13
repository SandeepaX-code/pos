import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "../src/lib/mongoose";
import { UserModel } from "../src/models/user";
import { BranchModel } from "../src/models/branch";
import { RoleModel } from "../src/models/role";

async function main() {
  await connectToDatabase();
  const branch = await BranchModel.findOne({ code: "CEN" });
  if (!branch) {
    throw new Error("Central branch not found. Run seed script first.");
  }
  
  const role = await RoleModel.findOne({ name: "kitchenStaff" });
  const passwordHash = await bcrypt.hash("Password123!", 12);
  
  await UserModel.findOneAndUpdate(
    { username: "kitchen1" },
    {
      fullName: "Kitchen Chef",
      username: "kitchen1",
      email: "kitchen@aurumbistro.com",
      phone: "+94 77 246 1111",
      role: "kitchenStaff",
      roleId: role ? role._id : undefined,
      branchId: branch._id,
      active: true,
      passwordHash,
    },
    { upsert: true, new: true }
  );
  
  console.log("KITCHEN_USER_CREATED_SUCCESSFULLY");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
