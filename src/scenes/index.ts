import { BotContext } from "../session";
import { Scenes } from "telegraf";
import { sendMessageScene } from "./sendMessage/sendMessage.scene";
import { mainScene } from "./Main/main.scene";
import { showMessagesScene } from "./ShowMessages/showMessages.scene";

export * from "./common";
export const BotStage = new Scenes.Stage<BotContext>([
  mainScene,
  sendMessageScene,
  showMessagesScene,
]);
