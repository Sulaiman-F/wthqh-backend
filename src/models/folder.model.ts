import mongoose, { Schema, Document } from "mongoose";

export interface FolderDoc extends Document {
  name: string;
  parentFolder?: mongoose.Types.ObjectId | null;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<FolderDoc>(
  {
    name: { type: String, required: true },
    parentFolder: { type: Schema.Types.ObjectId, ref: "Folder", default: null },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

FolderSchema.index({ owner: 1, parentFolder: 1, name: 1 }, { unique: true });

export const Folder = mongoose.model<FolderDoc>("Folder", FolderSchema);
