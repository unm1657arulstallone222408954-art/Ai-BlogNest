/**
 * Creates (or updates) a single admin account so you have a way
 * to log in and start granting roles via the API.
 *
 * Usage:
 *   ADMIN_EMAIL=admin@blognest.com ADMIN_PASSWORD=ChangeMe123! npm run seed:admin
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/userModel");

(async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL || "admin@blognest.com";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const name = process.env.ADMIN_NAME || "BlogNest Admin";

  let admin = await User.findOne({ email }).select("+password");

  if (admin) {
    admin.role = "admin";
    admin.password = password;
    await admin.save();
    console.log(`Existing user ${email} updated to admin.`);
  } else {
    admin = await User.create({ name, email, password, role: "admin" });
    console.log(`Admin created: ${email}`);
  }

  console.log(`Login with email: ${email} and the password you set.`);
  await mongoose.disconnect();
  process.exit(0);
})();
