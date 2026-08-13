import { connectToDatabase } from "../src/lib/mongoose";
import { UserModel } from "../src/models/user";

async function run() {
  await connectToDatabase();
  console.log("Connected to database.");

  const users = await UserModel.find({}, "fullName username email phone role active").lean().exec();
  console.log("--- USERS IN DATABASE ---");
  console.log(JSON.stringify(users, null, 2));
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
