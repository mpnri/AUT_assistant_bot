import { Message, MessageDocument, MessageState, User, useTransaction } from "../../db";
import { BotContext } from "../../session";
import { Markup, Scenes } from "telegraf";
import { ScenesIDs, goToMainScene } from "../common";
import { formatStrings } from "../../utils";
import { strings } from "../../intl/fa";

const str = strings.scenes.showMessages;

const handleShowMessages = async (ctx: BotContext, mode?: "next" | "back") => {
  const currentMessageID = ctx.session.currentMessageTemp?._id;
  if (mode && currentMessageID === undefined) throw new Error("no currentMessageID");
  const query = (() => {
    //* if no mode or currentMessage is empty, no condition
    if (!mode || !currentMessageID) return { $exists: true };

    return mode === "next" ? { $gt: currentMessageID } : { $lt: currentMessageID };
  })();
  console.log(query);

  const response = await Message.find({ state: MessageState.New, _id: query })
    .sort({ _id: mode === "back" ? -1 : 1 })
    .limit(1);
  const message = response[0];

  if (!message) {
    ctx.session.currentMessageTemp = { _id: "" };
    const extra = {
      reply_markup: {
        inline_keyboard: mode
          ? [
              [
                mode === "next"
                  ? Markup.button.callback("پیام قبلی", "back")
                  : Markup.button.callback("پیام بعدی", "next"),
              ],
              [Markup.button.callback("home", "home")],
            ]
          : [[Markup.button.callback("home", "home")]],
      },
    };
    if (mode) {
      await ctx.editMessageText(str.no_new_messages, extra);
    } else {
      await ctx.reply(str.no_new_messages, extra);
    }
    return;
  }

  const messageText =
    `🗒<b>${str.message_type}</b>\n${strings[message.type]}\n\n` +
    `✏️<b>${str.message_text}</b>\n${message.title}\n` +
    (message.type === "poll"
      ? message.pollOptions
          ?.map(
            (option, index) =>
              `🔸<b>${formatStrings(str.message_option, { number: index + 1 })}</b>` +
              "\n" +
              option,
          )
          .join("\n")
      : "");

  ctx.session.currentMessageTemp = { _id: message._id };
  const reply_markup = {
    inline_keyboard: [
      mode
        ? [Markup.button.callback("پیام قبلی", "back"), Markup.button.callback("پیام بعدی", "next")]
        : [Markup.button.callback("پیام بعدی", "next")],
      [Markup.button.callback("home", "home")],
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
};

const showMessagesScene = new Scenes.WizardScene<BotContext>(
  ScenesIDs.ShowMessagesScene,
  async (ctx) => {
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

showMessagesScene.action("home", async (ctx) => {
  await ctx.deleteMessage(ctx.callbackQuery.message?.message_id);
  await goToMainScene(ctx);
});

export { showMessagesScene };
