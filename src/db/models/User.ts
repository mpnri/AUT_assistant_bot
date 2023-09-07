import mongoose, { Schema } from "mongoose";

export interface UserDocument {
  uid: number;
  state: number;
  messages?: string[];
}

const userSchema = new Schema<UserDocument>(
  {
    uid: { type: Number, required: true, unique: true, index: true },
    state: { type: Number, required: true },
    messages: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const User = mongoose.model<UserDocument>("User", userSchema);
