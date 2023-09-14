import { Message, MessageDocument, User, useTransaction } from "../../db";
import { BotContext } from "../../session";
import { Markup, Scenes } from "telegraf";
import { ScenesIDs } from "../common";
import { MessageTypes, isTextMessage } from "../../utils";

//todo: split valid state(text or query) and back button
const isValidState = (
  ctx: BotContext,
  message?: MessageTypes.ServiceMessage,
  extraValidation?: (text: string) => boolean,
): message is MessageTypes.TextMessage => {
  // console.log((message as any)?.text)
  if (!message || !isTextMessage(message) || (extraValidation && !extraValidation(message.text))) {
    ctx.reply("ورودی معتبر نیست");
    return false;
  }

  if (message.text === "back") {
    ctx.scene.enter(ScenesIDs.MainScene);
    return false;
  }
  return true;
};

//todo: keyboards
// const keyboards = {
//   message_type: Markup.keyboard(["text", "poll", Markup.button.text("back")], {
//     columns: 2,
//   }).resize(),
  
// };

const sendMessageScene = new Scenes.WizardScene<BotContext>(
  ScenesIDs.SendMessageScene,
  async (ctx) => {
    ctx.session.messageTemp = undefined;
    //todo
    await ctx.reply(
      "Please choose your message type",
      Markup.keyboard(["text", "poll", Markup.button.text("back")], { columns: 2 }).resize(),
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    const message = ctx.message;
    if (!isValidState(ctx, message, (text) => ["text", "poll", "back"].includes(text))) {
      return;
    }

    ctx.session.messageTemp = { type: message.text === "text" ? "text" : "poll" };
    await ctx.reply("Please enter your message title", Markup.keyboard(["back"]));

    return ctx.wizard.next();
  },
  async (ctx) => {
    const message = ctx.message;
    if (!isValidState(ctx, message)) {
      return;
    }

    if (!ctx.session.messageTemp) throw new Error("no message Temp");
    ctx.session.messageTemp.title = message.text;
    if (ctx.session.messageTemp.type === "text") {
      await ctx.scene.leave();
    } else {
      ctx.reply("گزینه های خود رو هر کدام در یک پیام وارد کنید. برای پایان end بفرستید.");
      return ctx.wizard.next();
    }
  },
  async (ctx) => {
    const message = ctx.message;
    if (!isValidState(ctx, message)) {
      return;
    }
    const messageTemp = ctx.session.messageTemp;
    if (!messageTemp) throw new Error("no message Temp");
    if (!messageTemp.pollOptions) messageTemp.pollOptions = [];

    if (message.text.trim() === "end") {
      if (!messageTemp.pollOptions.length) {
        await ctx.reply("حداقل باید یک گزینه وارد کنید.");
        return;
      }
      await ctx.scene.leave();
      return;
    }
    await ctx.reply("لطفا گزینه بعدی رو ارسال کنید.");
    messageTemp.pollOptions.push(message.text);
  },
);

sendMessageScene.leave((ctx) => {
  const chat = ctx.chat;
  const message = ctx.session.messageTemp;
  if (chat?.type !== "private" || !message) return;

  const { title, type, pollOptions } = message;
  if (!title) return;

  useTransaction(async () => {
    const user = await User.findOne({ uid: chat.id });
    console.log(user);
    if (user) {
      const messageDB = new Message<MessageDocument>({
        title: title,
        senderID: user._id,
        type,
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
  //todo
  ctx.reply("Thanks for your feedback", Markup.keyboard(["Send Feedback", "Show Messages"]));
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
