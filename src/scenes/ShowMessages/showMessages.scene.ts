import { usePrisma } from "../../db";
import { BotContext } from "../../session";
import { Markup, Scenes } from "telegraf";
import { ScenesIDs, goToMainScene, isAdmin } from "../common";
import { formatStrings } from "../../utils";
import { strings } from "../../intl/fa";
import { MessageState, MessageType } from "@prisma/client";
import { escape, unescape } from "html-escaper";
import moment from "jalali-moment";

const prisma = usePrisma();

const str = strings.scenes.showMessages;

const handleShowMessages = async (ctx: BotContext, mode?: "next" | "back") => {
  const currentMessageID = ctx.session.currentMessageTemp?._id;
  if (mode && currentMessageID === undefined) throw new Error("no currentMessageID");
  const query = (() => {
    //* if mode is not defined or currentMessageID is empty -> no condition
    if (!mode || !currentMessageID) return {};

    //todo: use date not the id
    return mode === "next" ? { gt: currentMessageID } : { lt: currentMessageID };
  })();
  console.log(query);

  const message = await prisma.message.findFirst({
    where: { state: MessageState.New, id: query },
    orderBy: { id: mode === "back" ? "desc" : "asc" },
  });

  if (!message) {
    const extra = {
      reply_markup: {
        inline_keyboard: mode
          ? [
              [
                mode === "next"
                  ? Markup.button.callback(str.buttons.last_message, "back")
                  : Markup.button.callback(str.buttons.next_message, "next"),
              ],
              [Markup.button.callback(str.buttons.back_to_home, "home")],
            ]
          : [[Markup.button.callback(str.buttons.back_to_home, "home")]],
      },
    };
    try {
      ctx.answerCbQuery("❎ " + str.no_new_messages, { show_alert: false });
    } catch (e) {}

    if (mode) {
      //* if we have mode, then a callback query dispatched. so we can use edit text.
      // await ctx.editMessageText(str.no_new_messages, extra);
    } else {
      ctx.session.currentMessageTemp = { _id: "" };
      await ctx.reply(str.no_new_messages, extra);
    }
    return false;
  }

  const date = moment(message.createdAt).locale("fa").format("YYYY/MM/DD - HH:mm:ss");

  const messageText =
    `💡 <b>${str.message.id}</b>\n${escape(message.id)}\n\n` +
    `⏱️ <b>${str.message.date}</b>\n${escape(date)}\n\n` +
    `🔷 <b>${str.message.type}</b>\n${strings[message.type]}\n\n` +
    `✏️ <b>${str.message.text}</b>\n${escape(message.title)}\n\n` +
    (message.type === MessageType.Poll
      ? message.pollOptions
          ?.map(
            (option, index) =>
              `<b>${formatStrings(str.message.option, { number: index + 1 })}</b>` +
              `\n🔸 ${escape(option)}`,
          )
          .join("\n")
      : "");

  ctx.session.currentMessageTemp = { _id: message.id };
  const reply_markup = {
    inline_keyboard: [
      mode
        ? [
            Markup.button.callback(str.buttons.last_message, "back"),
            Markup.button.callback(str.buttons.next_message, "next"),
          ]
        : [Markup.button.callback(str.buttons.next_message, "next")],
      [
        Markup.button.callback(str.buttons.delete_message, "delete"),
        Markup.button.callback(str.buttons.confirm_message, "confirm"),
      ],
      [Markup.button.callback(str.buttons.back_to_home, "home")],
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
  if (!currentMessageID || !channelID) throw new Error("no currentMessageID or channelID");
  const message = await prisma.message.findUnique({ where: { id: currentMessageID } });
  if (!message) throw new Error("message now found");

  if (message.type === MessageType.Text) {
    await ctx.telegram.sendMessage(channelID, message.title);
  } else {
    if (!message.pollOptions?.length) throw new Error("empty options");
    await ctx.telegram.sendPoll(channelID, message.title, message.pollOptions);
  }

  await prisma.$transaction(async (tx) => {
    await tx.message.update({
      where: { id: message.id },
      data: { state: { set: MessageState.Sent } },
    });
  });

  await ctx.answerCbQuery(str.toasts.message_sent_successfully);

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

showMessagesScene.action("delete", async (ctx) => {
  const currentMessageID = ctx.session.currentMessageTemp?._id;
  if (!currentMessageID) throw new Error("no currentMessageID");
  const message = await prisma.message.findUnique({ where: { id: currentMessageID } });
  if (!message) throw new Error("message now found");

  await prisma.$transaction(async (tx) => {
    await tx.message.update({
      where: { id: message.id },
      data: { state: { set: MessageState.Deleted } },
    });
  });

  await ctx.answerCbQuery(str.toasts.message_deleted_successfully);

  let newMessageFound = await handleShowMessages(ctx, "next");
  if (!newMessageFound) {
    //* if no messages remaining in forward
    newMessageFound = await handleShowMessages(ctx, "back");
    if (!newMessageFound) {
      //* if no messages remaining at all
      await handleShowMessages(ctx);
    }
  }
});

showMessagesScene.action("home", async (ctx) => {
  await ctx.deleteMessage(ctx.callbackQuery.message?.message_id);
  await goToMainScene(ctx);
});

export { showMessagesScene };
