import mongoose from "mongoose";

export const connectToDB = async () => {
  const DB_URL = process.env.DB_URL;
  if (!DB_URL) throw new Error("no DB URL");

  await mongoose
    .connect(DB_URL, {
      autoIndex: true,
    })
    .catch((err) => {
      console.log("Connect to Mongo DB Error");
      throw err;
    });
  //todo: remove for authentication
  console.log("DB Connected:", DB_URL);
};

export { User, type UserDocument } from "./models/User";
export { useTransaction } from "./session";
