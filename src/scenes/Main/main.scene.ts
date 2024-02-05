import { BotContext } from "../../session";
import { Markup, Scenes } from "telegraf";
import { ScenesIDs, isAdmin } from "../common";
import { formatStrings } from "../../utils";
import { strings } from "../../intl/fa";

const str = strings.scenes.main;

const mainScene = new Scenes.WizardScene<BotContext>(ScenesIDs.MainScene, async (ctx) => {
  const chat = ctx.chat;
  if (chat?.type !== "private") return;
  const userName = chat.first_name + " " + (chat.last_name ?? "");
  console.log(ctx.session.cnt);
  if (ctx.session.cnt === undefined) ctx.session.cnt = 0;

  await ctx.reply(
    ctx.session.cnt ? str.start.any_help : formatStrings(str.start.hi_user, { name: userName }),
    isAdmin(ctx)
      ? Markup.keyboard([str.keyboard.send_question, str.keyboard.admin.review_messages])
      : Markup.keyboard([str.keyboard.send_question]),
  );
  ctx.session.cnt++;
});

mainScene.hears(str.keyboard.send_question, async (ctx) => {
  ctx.scene.enter(ScenesIDs.SendMessageScene);
});

mainScene.hears(str.keyboard.admin.review_messages, async (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.scene.enter(ScenesIDs.ShowMessagesScene);
});

// mainScene.hears("Show Messages 2", async (ctx) => {
//   if (!isAdmin(ctx)) return;
//   const messagesList = await Message.find();
//   const sendMessages = async (list: { title: string; index: number; pollOptions: string[] }[]) => {
//     if (!list.length) return;
//     const message = list.shift();
//     if (!message) return;
//     const rep =
//       `Message ${message.index}: \n${message.title}` +
//       (message.pollOptions.length ? `\nOptions: \n${message.pollOptions.join("\n")}` : "");
//     await ctx.reply(rep);
//     await sendMessages(list);
//   };

//   await sendMessages(
//     messagesList
//       .map((message, index) => ({
//         title: message.title,
//         pollOptions: message.type === "poll" ? message.pollOptions ?? [] : [],
//         index,
//       }))
//       .reverse()
//       .slice(0, 5)
//       .reverse(),
//   );
// });

export { mainScene };
