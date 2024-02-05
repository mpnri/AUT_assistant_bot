import { usePrisma } from "../../db";
import { BotContext } from "../../session";
import { Markup, Scenes } from "telegraf";
import { ScenesIDs, goToMainScene } from "../common";
import { MessageTypes, isDateQuery, isTextMessage } from "../../utils";
import { strings } from "../../intl/fa";
import { MessageState, MessageType } from "@prisma/client";

const str = strings.scenes.sendMessage;

const prisma = usePrisma();

//todo: split valid state(text or query) and back button
const isValidState = (
  ctx: BotContext,
  message?: MessageTypes.ServiceMessage,
  extraValidation?: (text: string) => boolean,
): message is MessageTypes.TextMessage => {
  if (!isTextMessage(message) || (extraValidation && !extraValidation(message.text))) {
    ctx.reply(strings.invalid_input);
    return false;
  }

  if (message.text === "back") {
    goToMainScene(ctx);
    return false;
  }
  return true;
};

// //todo: keyboards
// const keyboards = {
//   message_type: Markup.keyboard(["text", "poll", Markup.button.text("back")], {
//     columns: 2,
//   }).resize(),
// };

const sendMessageScene = new Scenes.WizardScene<BotContext>(
  ScenesIDs.SendMessageScene,
  async (ctx) => {
    ctx.session.messageTemp = undefined;

    const msg = await ctx.reply(str.loading, Markup.removeKeyboard());
    //* no await
    ctx.deleteMessage(msg.message_id);

    const replyMessage = await ctx.reply(str.get_message_type, {
      reply_markup: {
        inline_keyboard: [
          [
            Markup.button.callback(strings.Text, "text"),
            Markup.button.callback(strings.Poll, "poll"),
          ],
          [Markup.button.callback(strings.back_to_home, "home")],
        ],
      },
    });
    ctx.session.replyMessageID = replyMessage.message_id;
    return ctx.wizard.next();
  },
  async (ctx) => {
    const callbackQuery = ctx.callbackQuery;
    if (!isDateQuery(callbackQuery) || !["text", "poll", "home"].includes(callbackQuery.data)) {
      // await ctx.answerCbQuery(strings.invalid_input, { show_alert: false });
      return;
    }

    ctx.session.messageTemp = {
      type: callbackQuery.data === "text" ? MessageType.Text : MessageType.Poll,
    };
    //todo: add limitations for both
    await ctx.editMessageText(
      callbackQuery.data === "text" ? str.get_text_message_title : str.get_poll_message_title,
      {
        reply_markup: { inline_keyboard: [[Markup.button.callback(strings.back_to_home, "home")]] },
      },
    );

    return ctx.wizard.next();
  },
  async (ctx) => {
    const message = ctx.message;
    // if (!isValidState(ctx, message)) {
    if (!isTextMessage(message)) {
      return;
    }
    if (!ctx.session.messageTemp) throw new Error("no message Temp");
    //* no await
    ctx.deleteMessage(ctx.session.replyMessageID);

    const maxLength = ctx.session.messageTemp.type === MessageType.Text ? 1500 : 250;
    //todo: show error?
    ctx.session.messageTemp.title = message.text.substring(0, maxLength);
    if (ctx.session.messageTemp.type === MessageType.Text) {
      await goToMainScene(ctx);
    } else {
      const replyMessage = await ctx.reply(str.get_poll_options, {
        reply_markup: { inline_keyboard: [[Markup.button.callback(str.buttons.end, "end")]] },
      });
      ctx.session.replyMessageID = replyMessage.message_id;
      return ctx.wizard.next();
    }
  },
  async (ctx) => {
    const message = ctx.message;
    const callbackQuery = ctx.callbackQuery;
    // if (!isValidState(ctx, message)) {
    if (!isTextMessage(message) && !isDateQuery(callbackQuery)) {
      //!!!!!
      // await ctx.answerCbQuery(strings.invalid_input, { show_alert: false });
      return;
    }

    const messageTemp = ctx.session.messageTemp;
    if (!messageTemp) throw new Error("no message Temp");
    if (!messageTemp.pollOptions) messageTemp.pollOptions = [];

    if (isDateQuery(callbackQuery)) {
      if (callbackQuery.data === "end") {
        if (!messageTemp.pollOptions.length) {
          await ctx.answerCbQuery(str.should_send_one_option, { show_alert: false });
          return;
        }
        ctx.deleteMessage(ctx.session.replyMessageID);
        await goToMainScene(ctx);
        return ctx.wizard.next();
      }
      return;
    }

    if (isTextMessage(message)) {
      //todo: show error?
      messageTemp.pollOptions.push(message.text.substring(0, 100));
      ctx.deleteMessage(ctx.session.replyMessageID);
      const replyMessage = await ctx.reply(str.get_next_option, {
        reply_markup: { inline_keyboard: [[Markup.button.callback(str.buttons.end, "end")]] },
      });
      ctx.session.replyMessageID = replyMessage.message_id;
      if (messageTemp.pollOptions.length === 10) {
        ctx.deleteMessage(ctx.session.replyMessageID);
        await goToMainScene(ctx);
        return ctx.wizard.next();
      }
      return;
    }
  },
);

sendMessageScene.action("home", async (ctx) => {
  await ctx.deleteMessage(ctx.callbackQuery.message?.message_id);
  await goToMainScene(ctx);
});

sendMessageScene.leave(async (ctx) => {
  const chat = ctx.chat;
  const message = ctx.session.messageTemp;
  if (chat?.type !== "private" || !message) return;

  const { title, type, pollOptions } = message;
  if (!title) return;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { uid: chat.id } });
    console.log(user);
    if (user) {
      await tx.user.update({
        where: { uid: user.uid },
        data: {
          messages: {
            create: {
              title: title,
              state: MessageState.New,
              type,
              pollOptions,
            },
          },
        },
      });
    } else {
      throw new Error("user not found");
    }
  });
  ctx.session.messageTemp = undefined;
  await ctx.reply(str.message_sent_successfully);
});

export { sendMessageScene };
