// config/db.js
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/rolesdb";

// Connection options with pooling enabled
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 20,      // 🔥 connection pool size
  minPoolSize: 5,       // optional minimum pool size
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let retries = 0;
const maxRetries = 5; // how many times to try reconnecting
const retryDelay = 5000; // 5 seconds

async function connectWithRetry() {
  try {
    console.log(`MongoDB: Attempting connection (try ${retries + 1}) ...`);

    await mongoose.connect(MONGO_URI, mongooseOptions);

    console.log("MongoDB: Connected successfully ✔");

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB: Connection error ❌", err);
    });

  } catch (err) {
    retries++;
    console.error(`MongoDB: Connection failed (attempt ${retries})`, err.message);

    if (retries >= maxRetries) {
      console.error("MongoDB: Max retries reached. Exiting...");
      process.exit(1);
    }

    console.log(`MongoDB: Retrying in ${retryDelay / 1000} seconds...`);
    setTimeout(connectWithRetry, retryDelay);
  }
}

module.exports = connectWithRetry;
