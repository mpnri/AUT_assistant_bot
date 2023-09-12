import { SocksProxyAgent } from "socks-proxy-agent";
import { Context, Markup, Telegraf, session } from "telegraf";
import { strings } from "./intl/fa";
import { formatStrings } from "./utils";
import { Message, User, UserDocument, connectToDB, useTransaction } from "./db";
import { BotContext, InitialSessionData } from "./session";
import { BotStage, ScenesIDs } from "./scenes";

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
    if (chat.type !== "private") return;

    //* save user to DB if not exist
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
    const userName = chat.first_name + " " + (chat.last_name ?? "");
    ctx.session.cnt++;
    console.log(ctx.session.cnt);
    ctx.reply(
      formatStrings(strings.start.hi_user, { name: userName }),
      Markup.keyboard(["Send Feedback", "Show Messages"]),
    );
  });

  bot.hears("Send Feedback", async (ctx) => {
    ctx.scene.enter(ScenesIDs.SendMessageScene);
  });

  //todo
  bot.hears("Show Messages", async (ctx) => {
    const messagesList = await Message.find();
    const sendMessages = async (list: { title: string; index: number }[]) => {
      if (!list.length) return;
      const message = list.shift();
      if (!message) return;
      await ctx.reply(`Message ${message.index}: \n${message.title}`);
      await sendMessages(list);
    };

    await sendMessages(
      messagesList
        .map((message, index) => ({
          title: message.title,
          index,
        }))
        .reverse()
        .slice(0, 10)
        .reverse(),
    );
  });

  bot.launch();
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
};
