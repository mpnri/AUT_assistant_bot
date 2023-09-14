import { BotContext } from "../session";
import { Scenes } from "telegraf";
import { sendMessageScene } from "./sendMessage/sendMessageScene";
import { mainScene } from "./Main/mainScene";

export * from "./common";
export const BotStage = new Scenes.Stage<BotContext>([mainScene, sendMessageScene]);
