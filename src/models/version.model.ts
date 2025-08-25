import mongoose, { Schema, Document } from "mongoose";

export interface VersionDoc extends Document {
  document: mongoose.Types.ObjectId;
  versionNumber: number;
  storageKey: string; // GridFS fileId as hex string
  sizeBytes: number;
  mimeType: string;
  createdAt: Date;
}

const VersionSchema = new Schema<VersionDoc>(
  {
    document: { type: Schema.Types.ObjectId, ref: "Document", required: true },
    versionNumber: { type: Number, required: true },
    storageKey: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    mimeType: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

VersionSchema.index({ document: 1, versionNumber: 1 }, { unique: true });

export const Version = mongoose.model<VersionDoc>("Version", VersionSchema);
