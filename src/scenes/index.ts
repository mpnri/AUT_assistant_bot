import { BotContext } from "../session";
import {  Scenes } from "telegraf";
import { sendMessageScene } from "./sendMessage/sendMessageScene";

export * from "./common";
export const BotStage = new Scenes.Stage<BotContext>([sendMessageScene]);
