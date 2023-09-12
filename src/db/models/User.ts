import mongoose, { Schema, Types } from "mongoose";
import { Models } from "./common";

export interface UserDocument {
  uid: number;
  state: number;
  messages?: Types.ObjectId[];
}

const userSchema = new Schema<UserDocument>(
  {
    uid: { type: Number, required: true, unique: true, index: true },
    state: { type: Number, required: true },
    messages: { type: [Schema.Types.ObjectId], default: [] },
  },
  { timestamps: true },
);

export const User = mongoose.model<UserDocument>(Models.User, userSchema);
