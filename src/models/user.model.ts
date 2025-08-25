import mongoose, { Schema, Document } from "mongoose";

export interface UserDoc extends Document {
  name: string;
  email: string;
  role: "admin" | "member";
  password: string; // hashed
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<UserDoc>("User", UserSchema);
