import { Message, MessageDocument, MessageState, User, useTransaction } from "../../db";
import { BotContext } from "../../session";
import { Markup, Scenes } from "telegraf";
import { ScenesIDs, goToMainScene, isAdmin } from "../common";
import { formatStrings } from "../../utils";
import { strings } from "../../intl/fa";

const str = strings.scenes.showMessages;

const handleShowMessages = async (ctx: BotContext, mode?: "next" | "back") => {
  const currentMessageID = ctx.session.currentMessageTemp?._id;
  if (mode && currentMessageID === undefined) throw new Error("no currentMessageID");
  const query = (() => {
    //* if mode is not defined or currentMessageID is empty -> no condition
    if (!mode || !currentMessageID) return { $exists: true };

    return mode === "next" ? { $gt: currentMessageID } : { $lt: currentMessageID };
  })();
  console.log(query);

  const response = await Message.find({ state: MessageState.New, _id: query })
    .sort({ _id: mode === "back" ? -1 : 1 })
    .limit(1);
  const message = response[0];

  if (!message) {
    const extra = {
      reply_markup: {
        inline_keyboard: mode
          ? [
              [
                mode === "next"
                  ? Markup.button.callback("پیام قبلی ⬅️", "back")
                  : Markup.button.callback("➡️ پیام بعدی", "next"),
              ],
              [Markup.button.callback("🏠 بازگشت 🏠", "home")],
            ]
          : [[Markup.button.callback("🏠 بازگشت 🏠", "home")]],
      },
    };
    ctx.answerCbQuery("❎ " + str.no_new_messages, { show_alert: false });

    if (mode) {
      //* if we have mode, then a callback query dispatched. so we can use edit text.
      // await ctx.editMessageText(str.no_new_messages, extra);
    } else {
      ctx.session.currentMessageTemp = { _id: "" };
      await ctx.reply(str.no_new_messages, extra);
    }
    return false;
  }

  const messageText =
    `🔷 <b>${str.message_type}</b>\n${strings[message.type]}\n\n` +
    `✏️ <b>${str.message_text}</b>\n${message.title}\n\n` +
    (message.type === "poll"
      ? message.pollOptions
          ?.map(
            (option, index) =>
              `<b>${formatStrings(str.message_option, { number: index + 1 })}</b>` +
              `\n🔸 ${option}`,
          )
          .join("\n")
      : "");

  ctx.session.currentMessageTemp = { _id: message._id };
  const reply_markup = {
    inline_keyboard: [
      mode
        ? [
            Markup.button.callback("پیام قبلی ⬅️", "back"),
            Markup.button.callback("➡️ پیام بعدی", "next"),
          ]
        : [Markup.button.callback("➡️ پیام بعدی", "next")],
      [Markup.button.callback("✅ تایید و ارسال در کانال", "confirm")],
      [Markup.button.callback("🏠 بازگشت 🏠", "home")],
    ],
  };
  if (mode) {
    await ctx.editMessageText(messageText, {
      parse_mode: "HTML",
      reply_markup,
    });
  } else {
    await ctx.reply(messageText, {
      parse_mode: "HTML",
      reply_markup,
    });
  }
  return true;
};

const showMessagesScene = new Scenes.WizardScene<BotContext>(
  ScenesIDs.ShowMessagesScene,
  async (ctx) => {
    if (!isAdmin(ctx)) {
      await goToMainScene(ctx);
      return;
    }
    const chat = ctx.chat;
    ctx.session.currentMessageTemp = undefined;
    if (chat?.type !== "private") return;

    const msg = await ctx.reply(str.loading_messages, Markup.removeKeyboard());
    //* no await
    ctx.deleteMessage(msg.message_id);

    await handleShowMessages(ctx);

    return ctx.wizard.next();
  },
);

showMessagesScene.action("next", async (ctx) => {
  await handleShowMessages(ctx, "next");
  // await ctx.deleteMessage(ctx.callbackQuery.message?.message_id);
});

showMessagesScene.action("back", async (ctx) => {
  await handleShowMessages(ctx, "back");
  // await ctx.deleteMessage(ctx.callbackQuery.message?.message_id);
});

showMessagesScene.action("confirm", async (ctx) => {
  const currentMessageID = ctx.session.currentMessageTemp?._id;
  const channelID = process.env.CHANNEL_ID;
  if (!currentMessageID || !channelID) throw new Error("no currentMessageID");
  const message = await Message.findById(currentMessageID);
  if (!message) throw new Error("message now found");
  console.log(channelID);
  if (message.type === "text") {
    await ctx.telegram.sendMessage(channelID, message.title);
  } else {
    if (!message.pollOptions?.length) throw new Error("empty options");
    await ctx.telegram.sendPoll(channelID, message.title, message.pollOptions);
  }
  await useTransaction(async () => {
    message.state = MessageState.Sent;
    await message.save();
  });
  let newMessageFound = await handleShowMessages(ctx, "next");
  if (!newMessageFound) {
    //* if no messages remaining in forward
    newMessageFound = await handleShowMessages(ctx, "back");
    if (!newMessageFound) {
      //* if no messages remaining at all
      await handleShowMessages(ctx);
    }
  }
  // await ctx.deleteMessage(ctx.callbackQuery.message?.message_id);
});

showMessagesScene.action("home", async (ctx) => {
  await ctx.deleteMessage(ctx.callbackQuery.message?.message_id);
  await goToMainScene(ctx);
});

export { showMessagesScene };
