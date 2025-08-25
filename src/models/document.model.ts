import mongoose, { Schema, Document } from "mongoose";

export interface DocumentDoc extends Document {
  folder: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<DocumentDoc>(
  {
    folder: { type: Schema.Types.ObjectId, ref: "Folder", required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

DocumentSchema.index({ folder: 1, title: 1 });

export const DocModel = mongoose.model<DocumentDoc>("Document", DocumentSchema);
