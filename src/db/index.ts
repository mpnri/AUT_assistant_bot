import { PrismaClient } from "@prisma/client";
// import mongoose from "mongoose";

const prisma = new PrismaClient();
export const usePrisma = () => prisma;

// export const connectToDB = async () => {
//   const DB_URL = process.env.DB_URL;
//   if (!DB_URL) throw new Error("no DB URL");

//   await mongoose
//     .connect(DB_URL, {
//       autoIndex: true,
//     })
//     .catch((err) => {
//       console.log("Connect to Mongo DB Error");
//       throw err;
//     });
//   //todo: remove for authentication
//   console.log("DB Connected:", DB_URL);
// };

// export * from "./models";
// export { useTransaction } from "./session";
