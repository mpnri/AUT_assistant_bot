import { Message, MessageDocument, User, useTransaction } from "../../db";
import { BotContext } from "../../session";
import { Markup, Scenes } from "telegraf";
import { ScenesIDs } from "../common";
import { formatStrings } from "../../utils";
import { strings } from "../../intl/fa";

const str = strings.scenes.main;

const mainScene = new Scenes.WizardScene<BotContext>(ScenesIDs.MainScene, async (ctx) => {
  const chat = ctx.chat;
  if (chat?.type !== "private") return;
  const userName = chat.first_name + " " + (chat.last_name ?? "");
  await ctx.reply(
    ctx.session.cnt ? str.start.any_help : formatStrings(str.start.hi_user, { name: userName }),
    Markup.keyboard(["Send Feedback", "Show Messages"]),
  );
  ctx.session.cnt = 1;
});

mainScene.hears("Send Feedback", async (ctx) => {
  ctx.scene.enter(ScenesIDs.SendMessageScene);
});

mainScene.hears("Show Messages", async (ctx) => {
  ctx.scene.enter(ScenesIDs.ShowMessagesScene);
});

mainScene.hears("Show Messages 2", async (ctx) => {
  const messagesList = await Message.find();
  const sendMessages = async (list: { title: string; index: number; pollOptions: string[] }[]) => {
    if (!list.length) return;
    const message = list.shift();
    if (!message) return;
    const rep =
      `Message ${message.index}: \n${message.title}` +
      (message.pollOptions.length ? `\nOptions: \n${message.pollOptions.join("\n")}` : "");
    await ctx.reply(rep);
    await sendMessages(list);
  };

  await sendMessages(
    messagesList
      .map((message, index) => ({
        title: message.title,
        pollOptions: message.type === "poll" ? message.pollOptions ?? [] : [],
        index,
      }))
      .reverse()
      .slice(0, 5)
      .reverse(),
  );
});

export { mainScene };
