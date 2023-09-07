import { SocksProxyAgent } from "socks-proxy-agent";
import { Context, Telegraf, session } from "telegraf";
import { strings } from "./intl/fa";
import { formatStrings } from "./utils";
import { User, UserDocument, connectToDB } from "./db";

const proxy = new SocksProxyAgent("socks5://127.0.0.1:10808");

interface SessionData {
  status?: string;
  cnt: number;
}

interface BotContext extends Context {
  session: SessionData;
}

export const MainApp = async (token: string) => {
  await connectToDB();

  const bot = new Telegraf<BotContext>(token, {
    telegram: { agent: proxy },
  });

  bot.use(session({ defaultSession: () => ({ cnt: 0 }) }));

  bot.start(async (ctx) => {
    const chat = ctx.chat;
    if (chat.type !== "private") return;

    //* save user to DB if not exist
    // await User.updateOne(
    //   { uid: chat.id },
    //   { $setOnInsert: { uid: chat.id, state: 0 } },
    //   { upsert: true },
    // );
    if (!(await User.findOne({ uid: chat.id }))) {
      const userDB = new User<UserDocument>({ uid: chat.id, state: 0 });
      await userDB.save();
    }
    //* save user to DB if not exist

    // const user = (await ctx.getChatMember(chat.id)).user;
    const userName = chat.first_name + " " + (chat.last_name ?? "");
    ctx.session.cnt++;
    console.log(ctx.session.cnt);
    ctx.reply(formatStrings(strings.start.hi_user, { name: userName }));
  });

  bot.launch();
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
};
