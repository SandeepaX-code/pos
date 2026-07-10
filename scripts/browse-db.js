const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Load .env.local
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
  console.log("✅ Connected to MongoDB!\n");

  const db = mongoose.connection.db;

  // List all collections
  const collections = await db.listCollections().toArray();
  console.log("📂 Collections in aurum_pos_suite:");
  console.log("─".repeat(50));

  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`  📄 ${col.name.padEnd(25)} → ${count} documents`);
  }

  console.log("\n" + "═".repeat(50));

  // Show sample data from key collections
  const keyCollections = ["users", "roles", "products", "branches", "orders", "permissions"];

  for (const name of keyCollections) {
    try {
      const docs = await db.collection(name).find({}).limit(5).toArray();
      if (docs.length > 0) {
        console.log(`\n🔍 ${name.toUpperCase()} (first ${docs.length}):`);
        console.log("─".repeat(50));
        for (const doc of docs) {
          // Show key fields only
          const summary = {};
          for (const [k, v] of Object.entries(doc)) {
            if (k === "passwordHash" || k === "__v") continue;
            if (typeof v === "object" && v !== null && !Array.isArray(v) && !(v instanceof Date) && !(v instanceof mongoose.Types.ObjectId)) {
              summary[k] = "[Object]";
            } else if (Array.isArray(v)) {
              summary[k] = `[Array(${v.length})]`;
            } else {
              summary[k] = v;
            }
          }
          console.log(JSON.stringify(summary, null, 2));
          console.log("  ---");
        }
      }
    } catch (e) {
      // collection might not exist
    }
  }

  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
