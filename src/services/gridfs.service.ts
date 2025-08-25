import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

let bucket: GridFSBucket | null = null;

export function getGridFSBucket(): GridFSBucket {
  if (!mongoose.connection.db) {
    throw new Error("MongoDB not connected");
  }
  if (!bucket) {
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "pdfs",
    });
  }
  return bucket;
}
