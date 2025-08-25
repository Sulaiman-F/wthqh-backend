import mongoose from "mongoose";

export async function connectDB(uri: string) {
  try {
    await mongoose.connect(uri);
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().command({ ping: 1 });
    }
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error", err);
    process.exit(1);
  }
}
