import mongoose, { Schema, Types } from "mongoose";
import { Models } from "./common";

export interface MessageDocument {
  id?: Types.ObjectId;
  title: string;
  senderID: Types.ObjectId;
  type: "text" | "poll";
  pollOptions?: string[];
}

const messageSchema = new Schema<MessageDocument>(
  {
    id: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    senderID: {
      type: Schema.Types.ObjectId,
      ref: Models.User,
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "poll"],
      required: true,
    },
    pollOptions: {
      type: [String],
      // validate: {
      //   // propsParameter: true,
      //   validator: (self: MessageDocument, value: MessageDocument["pollOptions"]) => {
      //     console.log(self)
      //     console.log( value);
      //     return !!(self.type === "poll"
      //       ? value && value?.length > 0
      //       : !value || value.length === 0);
      //   },
      //   message: "Poll options are required for poll messages!",
      // },
      default: [],
    },
  },
  { timestamps: true },
);

export const Message = mongoose.model<MessageDocument>(Models.Message, messageSchema);
