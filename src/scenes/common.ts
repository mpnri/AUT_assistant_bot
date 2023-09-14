import { BotContext } from "../session";

export enum ScenesIDs {
  MainScene = "MainScene",
  SendMessageScene = "SendMessageScene",
}

export const goToMainScene = (ctx: BotContext) => ctx.scene.enter(ScenesIDs.MainScene);
