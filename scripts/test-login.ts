import bcrypt from "bcryptjs";
import { connectToDatabase } from "../src/lib/mongoose";
import { UserModel } from "../src/models/user";

async function run() {
  await connectToDatabase();
  console.log("Connected to database.");

  const username = "superadmin";
  const password = "Password123!";

  const user = await UserModel.findOne({ username }).select("+passwordHash").lean().exec();
  if (!user) {
    console.error(`User '${username}' not found in database.`);
    process.exit(1);
  }

  console.log("User found:", {
    fullName: user.fullName,
    username: user.username,
    role: user.role,
    active: user.active,
  });

  const matches = await bcrypt.compare(password, String(user.passwordHash));
  console.log("Password matches:", matches);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
