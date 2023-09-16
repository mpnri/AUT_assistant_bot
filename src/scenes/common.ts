import { BotContext } from "../session";

export enum ScenesIDs {
  MainScene = "MainScene",
  SendMessageScene = "SendMessageScene",
  ShowMessagesScene = "ShowMessagesScene",
}

export const goToMainScene = (ctx: BotContext) => ctx.scene.enter(ScenesIDs.MainScene);

const getAdminUsers = () => process.env.ADMIN_USERS?.split(",");

export const isAdmin = (ctx: BotContext) => {
  const chat = ctx.chat;
  if (chat?.type !== "private") return false;
  return Boolean(getAdminUsers()?.includes(chat.id.toString()));
};
