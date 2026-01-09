#!/usr/bin/env node
require("dotenv").config();
const bcrypt = require("bcrypt"); // Make sure to require bcrypt here
const { loadEnv } = require("../config/env");
const { connectDB } = require("../config/db");
const models = require("../models");

async function seed() {
  const env = loadEnv();
  await connectDB(env.mongoUri);

  console.log("🧹 Cleaning up old data...");
  // Force Delete the admin user to ensure a clean slate
  await models.User.deleteOne({ email: "admin@tasky.local" });

  console.log("🔨 Creating new Admin User (Direct Injection)...");
  
  // Manually encrypt the password here
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("password", salt);

  // Use 'collection.insertOne'
  const adminInsert = await models.User.collection.insertOne({
    name: "Admin",
    email: "admin@tasky.local",
    password: hashedPassword,
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0
  });

  const adminId = adminInsert.insertedId;
  console.log(`✅ Admin created! Email: admin@tasky.local | Password: password`);

  // --- RE-CREATE BOARD & DATA ---
  
  // Reuse or Create Board
  let board = await models.Board.findOne({ title: "Test Board" });
  if (!board) {
    board = await models.Board.create({ 
        title: "Test Board", 
        description: "Seeded test board", 
        owner: adminId 
    });
  }

  // Reuse or Create Columns
  const columnsData = ["Backlog", "Todo", "Doing", "Reviewing", "Finished"];
  const columns = [];
  for (let i = 0; i < columnsData.length; i++) {
    let col = await models.Column.findOne({ title: columnsData[i], board: board._id });
    if (!col) {
      col = await models.Column.create({ title: columnsData[i], board: board._id, position: i });
    }
    columns.push(col);
  }

  // Create Tickets if empty
  const ticketCount = await models.Ticket.countDocuments({ board: board._id });
  if (ticketCount === 0) {
      await models.Ticket.create({
        title: "Welcome to Tasky",
        description: "This is a seeded ticket to get you started.",
        board: board._id,
        column: columns[0]._id, // Backlog
        assignee: adminId,
        position: 0,
      });
      console.log("✅ Created default tickets.");
  }

  console.log("🎉 Seeding complete. You can now log in.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed Error:", err);
  process.exit(1);
});