import dotenv from "dotenv";
import { MainApp } from "./app";

dotenv.config().parsed;

const token = process.env.TOKEN;

if (!token) throw new Error("no Token");

console.log("====================================");
console.log("TOKEN Available");
console.log("====================================");

MainApp(token);

export {};
