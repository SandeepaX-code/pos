const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

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
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "aurum_pos_suite" });
  console.log("Connected to MongoDB!");

  const users = await mongoose.connection.db.collection("users").find().toArray();
  const bcrypt = require("bcryptjs");
  console.log("Seeded Users:");
  for (const u of users) {
    const isMatch = await bcrypt.compare("Password123!", u.passwordHash);
    console.log(`- Username: "${u.username}", Hash: "${u.passwordHash}", Match: ${isMatch}`);
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
