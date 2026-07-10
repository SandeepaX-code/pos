const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join("=").trim();
      process.env[key] = value;
    }
  }
}

async function run() {
  const username = process.argv[2] || "superadmin";
  const password = process.argv[3] || "Password123!";
  const email = process.argv[4] || "admin@aurumbistro.com";

  await mongoose.connect(process.env.MONGODB_URI, { dbName: "aurum_pos_suite" });
  console.log("Connected to MongoDB!");

  // Find a branch to assign the user to
  const branch = await mongoose.connection.db.collection("branches").findOne({});
  if (!branch) {
    console.error("No branches found in database! Please run seed script first.");
    process.exit(1);
  }

  // Find the superAdmin role
  const roleDoc = await mongoose.connection.db.collection("roles").findOne({ name: "superAdmin" });
  const roleId = roleDoc ? roleDoc._id : null;

  const passwordHash = await bcrypt.hash(password, 12);

  const existingUser = await mongoose.connection.db.collection("users").findOne({ username });

  if (existingUser) {
    await mongoose.connection.db.collection("users").updateOne(
      { _id: existingUser._id },
      {
        $set: {
          role: "superAdmin",
          roleId,
          active: true,
          passwordHash,
          email,
        }
      }
    );
    console.log(`Successfully updated existing user "${username}" to superAdmin with password: "${password}"`);
  } else {
    await mongoose.connection.db.collection("users").insertOne({
      fullName: "Super Admin",
      username,
      email,
      phone: "+94 77 123 4567",
      role: "superAdmin",
      roleId,
      branchId: branch._id,
      active: true,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`Successfully created new superAdmin user "${username}" with password: "${password}"`);
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
