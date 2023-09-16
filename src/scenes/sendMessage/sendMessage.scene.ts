import { Message, MessageDocument, MessageState, User, useTransaction } from "../../db";
import { BotContext } from "../../session";
import { Markup, Scenes } from "telegraf";
import { ScenesIDs, goToMainScene } from "../common";
import { MessageTypes, isDateQuery, isTextMessage } from "../../utils";
import { strings } from "../../intl/fa";

const str = strings.scenes.sendMessage;

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
            Markup.button.callback(strings.text, "text"),
            Markup.button.callback(strings.poll, "poll"),
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
      await ctx.answerCbQuery(strings.invalid_input, { show_alert: false });
      return;
    }

    ctx.session.messageTemp = { type: callbackQuery.data === "text" ? "text" : "poll" };
    //todo: add limitations for both
    await ctx.editMessageText(str.get_message_title, {
      reply_markup: { inline_keyboard: [[Markup.button.callback(strings.back_to_home, "home")]] },
    });

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

    ctx.session.messageTemp.title = message.text;
    if (ctx.session.messageTemp.type === "text") {
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
      messageTemp.pollOptions.push(message.text);
      ctx.deleteMessage(ctx.session.replyMessageID);
      const replyMessage = await ctx.reply(str.get_next_option, {
        reply_markup: { inline_keyboard: [[Markup.button.callback(str.buttons.end, "end")]] },
      });
      ctx.session.replyMessageID = replyMessage.message_id;
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

  await useTransaction(async () => {
    const user = await User.findOne({ uid: chat.id });
    console.log(user);
    if (user) {
      const messageDB = new Message({
        title: title,
        senderID: user._id,
        type,
        state: MessageState.New,
        pollOptions,
      });
      messageDB.save();

      user.messages?.push(messageDB._id);
      user.save();
      //todo: populate?
    } else {
      throw new Error("user not found");
    }
  });
  ctx.session.messageTemp = undefined;
  await ctx.reply(str.message_sent_successfully);
});

export { sendMessageScene };

// const sendMessageScene = new Scenes.BaseScene<BotContext>(ScenesIDs.SendMessageScene);

// sendMessageScene.enter(async (ctx) => {
//   ctx.session.messageTemp = undefined;
//   //todo:
//   ctx.reply("Please enter your message", Markup.keyboard(["back"]));
// });

// sendMessageScene.on("text", (ctx) => {
//   //todo:

//   if (ctx.message.text === "back") {
//     ctx.scene.leave();
//     ctx.reply("OK", Markup.keyboard(["Send Feedback", "Show Messages"]));
//     return;
//   }

//   if (ctx.message.text) {
//     const messageText = ctx.message.text;
//     // if (ctx.session.messageTmp?.title) {
//     //   //todo
//     // } else {
//     ctx.session.messageTemp = { title: messageText };
//     ctx.scene.leave();
//     // }
//   }
// });

// sendMessageScene.leave((ctx) => {
//   const chat = ctx.chat;
//   const message = ctx.session.messageTemp;
//   if (chat?.type !== "private" || !message) return;
//   useTransaction(async () => {
//     const user = await User.findOne({ uid: chat.id });
//     console.log(user);
//     if (user) {
//       const messageDB = new Message<MessageDocument>({
//         title: message.title,
//         senderID: user._id,
//         type: "text",
//       });
//       messageDB.save();

//       user.messages?.push(messageDB._id);
//       user.save();
//       //todo: populate?
//     } else {
//       throw new Error("user not found");
//     }
//   });
//   ctx.session.messageTemp = undefined;
//   //todo
//   ctx.reply("Thanks for your feedback", Markup.keyboard(["Send Feedback", "Show Messages"]));
// });
