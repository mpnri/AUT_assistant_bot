import { Message, MessageDocument, User, useTransaction } from "../../db";
import { BotContext } from "../../session";
import { Markup, Scenes } from "telegraf";
import { ScenesIDs } from "../common";
import { isTextMessage } from "../../utils";

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

const sendMessageScene = new Scenes.WizardScene<BotContext>(
  ScenesIDs.SendMessageScene,
  async (ctx) => {
    // ctx.wizard.
    ctx.session.messageTemp = undefined;
    //todo:
    ctx.reply("Please enter your message", Markup.keyboard(["back"]));

    return ctx.wizard.next();
  },
  async (ctx) => {
    const message = ctx.message;
    if (!message || !isTextMessage(message)) {
      ctx.reply("لطفا یک پیام متنی ارسال کنید");
      return;
    }

    if (message.text === "back") {
      ctx.scene.leave();
      //todo:
      ctx.reply("OK", Markup.keyboard(["Send Feedback", "Show Messages"]));
      return;
    }

    const messageText = message.text;
    ctx.session.messageTemp = { title: messageText };
    ctx.scene.leave();
  },
);

sendMessageScene.leave((ctx) => {
  const chat = ctx.chat;
  const message = ctx.session.messageTemp;
  if (chat?.type !== "private" || !message) return;
  useTransaction(async () => {
    const user = await User.findOne({ uid: chat.id });
    console.log(user);
    if (user) {
      const messageDB = new Message<MessageDocument>({
        title: message.title,
        senderID: user._id,
        type: "text",
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
