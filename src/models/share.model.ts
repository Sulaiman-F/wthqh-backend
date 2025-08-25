import mongoose, { Schema, Document } from "mongoose";

export interface ShareDoc extends Document {
  document: mongoose.Types.ObjectId;
  token: string;
  expiresAt?: Date;
  createdAt: Date;
}

const ShareSchema = new Schema<ShareDoc>(
  {
    document: { type: Schema.Types.ObjectId, ref: "Document", required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ShareSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { expiresAt: { $type: "date" } },
  }
);

export const Share = mongoose.model<ShareDoc>("Share", ShareSchema);
