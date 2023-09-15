import { BotContext } from "../session";

export enum ScenesIDs {
  MainScene = "MainScene",
  SendMessageScene = "SendMessageScene",
  ShowMessagesScene = "ShowMessagesScene",
}

export const goToMainScene = (ctx: BotContext) => ctx.scene.enter(ScenesIDs.MainScene);
