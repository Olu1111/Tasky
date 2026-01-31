const mongoose = require("mongoose");

async function connectDB(mongoUri) {
  mongoose.set("strictQuery", true);

  try {
    const isProduction = process.env.NODE_ENV === "production";
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: isProduction ? 10 : 5,
      minPoolSize: isProduction ? 5 : 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
    });
    
    console.log("✅ Connected to MongoDB");
    
    // Monitor connection events in production
    if (isProduction) {
      mongoose.connection.on("disconnected", () => {
        console.warn("⚠️  MongoDB disconnected");
      });
      
      mongoose.connection.on("reconnected", () => {
        console.log("✅ MongoDB reconnected");
      });
      
      mongoose.connection.on("error", (err) => {
        console.error("❌ MongoDB connection error:", err.message);
      });
    }
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    throw err;
  }
}

module.exports = { connectDB };
