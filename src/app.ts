import { SocksProxyAgent } from "socks-proxy-agent";
import { Context, Markup, Telegraf, session } from "telegraf";
import { strings } from "./intl/fa";
import { formatStrings } from "./utils";
import { User, UserDocument, connectToDB } from "./db";
import { BotContext, InitialSessionData } from "./session";
import { BotStage } from "./Scenes";

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
    if (!(await User.findOne({ uid: chat.id }))) {
      const userDB = new User<UserDocument>({ uid: chat.id, state: 0 });
      await userDB.save();
    }
    // await User.updateOne(
    //   { uid: chat.id },
    //   { $setOnInsert: { uid: chat.id, state: 0 } },
    //   { upsert: true },
    // );
    const userName = chat.first_name + " " + (chat.last_name ?? "");
    ctx.session.cnt++;
    console.log(ctx.session.cnt);
    ctx.reply(formatStrings(strings.start.hi_user, { name: userName }), Markup.keyboard(["text"]));
  });

  bot.launch();
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
};
