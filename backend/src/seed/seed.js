#!/usr/bin/env node
require("dotenv").config();

const bcrypt = require("bcrypt");
const { loadEnv } = require("../config/env");
const { connectDB } = require("../config/db");
const models = require("../models");

async function seed() {
  const env = loadEnv();
  await connectDB(env.mongoUri);

  // Create or reuse admin user
  const adminEmail = "admin@tasky.local";
  let admin = await models.User.findOne({ email: adminEmail });
  if (!admin) {
    const hashed = await bcrypt.hash("password", 10);
    admin = await models.User.create({ name: "Admin", email: adminEmail, password: hashed, role: "admin" });
    console.log("Created admin user:", admin.email);
  } else {
    console.log("Admin user already exists:", admin.email);
  }

  // Create test board
  let board = await models.Board.findOne({ title: "Test Board" });
  if (!board) {
    board = await models.Board.create({ title: "Test Board", description: "Seeded test board", owner: admin._id });
    console.log("Created board:", board.title);
  } else {
    console.log("Board already exists:", board.title);
  }

  // Create columns (backlog -> todo -> doing -> reviewing -> finished)
  const columnsData = ["Backlog", "Todo", "Doing", "Reviewing", "Finished"];
  const columns = [];
  for (let i = 0; i < columnsData.length; i++) {
    const title = columnsData[i];
    let col = await models.Column.findOne({ title, board: board._id });
    if (!col) {
      col = await models.Column.create({ title, board: board._id, position: i });
      console.log("Created column:", col.title);
    }
    columns.push(col);
  }

  // Create a couple tickets
  const ticket1 = await models.Ticket.create({
    title: "Seed: Welcome to the board",
    description: "This is a seeded ticket.",
    board: board._id,
    column: columns[0]._id,
    assignee: admin._id,
    position: 0,
  });

  const ticket2 = await models.Ticket.create({
    title: "Seed: In progress example",
    description: "This ticket is in progress.",
    board: board._id,
    column: columns[2]._id, // place in "Doing"
    assignee: admin._id,
    position: 0,
  });

  console.log("Created tickets:", ticket1.title, ",", ticket2.title);

  // Add comments
  const comment = await models.Comment.create({ ticket: ticket1._id, author: admin._id, text: "First seeded comment" });
  ticket1.comments.push(comment._id);
  await ticket1.save();

  console.log("Added comment to", ticket1.title);

  console.log("Seeding complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
