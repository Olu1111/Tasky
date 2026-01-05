require("dotenv").config();

const { loadEnv } = require("./config/env");
const { connectDB } = require("./config/db");
const { createApp } = require("./app");

async function start() {
  const env = loadEnv();

  await connectDB(env.mongoUri);

  const app = createApp({ corsOrigin: env.corsOrigin });

  app.listen(env.port, () => {
    console.log(`🚀 Server running on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
