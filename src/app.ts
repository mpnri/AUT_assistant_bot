import { SocksProxyAgent } from "socks-proxy-agent";
import { Context, Markup, Telegraf, session } from "telegraf";
import { strings } from "./intl/fa";
import { User, UserDocument, connectToDB, useTransaction } from "./db";
import { BotContext, InitialSessionData } from "./session";
import { BotStage, ScenesIDs, goToMainScene } from "./scenes";

const proxy = new SocksProxyAgent("socks5://127.0.0.1:10808");

export const MainApp = async (token: string) => {
  await connectToDB();

  const bot = new Telegraf<BotContext>(token, {
    telegram: { agent: proxy },
  });

  bot.use(session({ defaultSession: () => InitialSessionData }));
  bot.use(BotStage.middleware());

  bot.start(async (ctx) => {
    const chat = ctx.chat;
    // console.log(chat);
    // console.log(ctx.message);
    if (chat.type !== "private") return;

    //* add user to DB if not exist
    await useTransaction(async () => {
      if (!(await User.findOne({ uid: chat.id }))) {
        const userDB = new User<UserDocument>({ uid: chat.id, state: 0 });
        await userDB.save();
      }
    });
    //todo: add catch??
    // await User.updateOne(
    //   { uid: chat.id },
    //   { $setOnInsert: { uid: chat.id, state: 0 } },
    //   { upsert: true },
    // );

    ctx.session.cnt = 0;
    console.log(ctx.session.cnt);
    await ctx.telegram.setMyCommands([{ command: "/start", description: "شروع مجدد بات" }]);
    await goToMainScene(ctx);
  });

  bot.use(async (ctx) => {
    if (ctx.scene.current?.id !== ScenesIDs.MainScene) {
      await goToMainScene(ctx);
    }
  });

  bot.launch();
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
};
