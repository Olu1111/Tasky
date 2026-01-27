#!/usr/bin/env node
/**
 * Script to create test users with different roles for testing role enforcement
 * Usage: node create-test-users.js
 */

require("dotenv").config();
const bcrypt = require("bcrypt");
const { loadEnv } = require("../config/env");
const { connectDB } = require("../config/db");
const models = require("../models");

const TEST_USERS = [
  {
    name: "Admin User",
    email: "admin@tasky.local",
    password: "password",
    role: "admin"
  },
  {
    name: "Member User",
    email: "member@tasky.local",
    password: "password",
    role: "member"
  },
  {
    name: "Viewer User",
    email: "viewer@tasky.local",
    password: "password",
    role: "viewer"
  }
];

async function createTestUsers() {
  try {
    const env = loadEnv();
    await connectDB(env.mongoUri);

    console.log("🧹 Cleaning up old test users...");
    
    // Remove existing test users
    for (const user of TEST_USERS) {
      await models.User.deleteOne({ email: user.email });
    }

    console.log("👥 Creating test users...\n");

    for (const userData of TEST_USERS) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const result = await models.User.collection.insertOne({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      });

      console.log(`✅ Created ${userData.role.toUpperCase()} user:`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Password: ${userData.password}`);
      console.log(`   Role: ${userData.role}`);
      console.log(`   ID: ${result.insertedId}\n`);
    }

    console.log("🎉 Test users created successfully!");
    console.log("\nYou can now test role enforcement with these credentials:");
    console.log("─".repeat(60));
    TEST_USERS.forEach(user => {
      console.log(`${user.role.toUpperCase().padEnd(10)} | ${user.email.padEnd(30)} | password`);
    });
    console.log("─".repeat(60));

    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating test users:", err);
    process.exit(1);
  }
}

createTestUsers();
