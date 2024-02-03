import dotenv from "dotenv";
import { Main } from "./app";

dotenv.config().parsed;

const token = process.env.TOKEN;

if (!token) throw new Error("no Token");

console.log("====================================");
console.log("TOKEN Available");
console.log("====================================");

Main(token)


