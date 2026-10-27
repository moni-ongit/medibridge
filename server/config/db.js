const mongoose = require("mongoose");

/**
 * Connects to MongoDB using the URI provided in the environment.
 * The server will still boot even if Mongo is temporarily unreachable
 * so that the frontend can be demoed / the health check can respond,
 * but every DB-backed route will fail until the connection succeeds.
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/medibridge";
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.error("   The API will keep running, but database routes will fail until MongoDB is reachable.");
  }
};

module.exports = connectDB;
