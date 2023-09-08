import { BotContext } from "src/session";
import { Scenes } from "telegraf";

export enum ScenesIDs {
  SendMessageScene = "SendMessageScene",
}

const sendMessageScene = new Scenes.BaseScene<BotContext>(ScenesIDs.SendMessageScene);

sendMessageScene.enter((ctx) => {
  ctx.session.messageTmp = undefined;
  ctx.reply("Please enter your message");
});

sendMessageScene.on("text", (ctx) => {
  if (ctx.message.text) {
    const messageText = ctx.message.text;
    if (ctx.session.messageTmp?.title) {
      //todo
    } else {
      ctx.session.messageTmp = { title: messageText };
    }
  }
});

export const BotStage = new Scenes.Stage<BotContext>([sendMessageScene]);
