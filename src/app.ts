import { SocksProxyAgent } from "socks-proxy-agent";
import { Context, Telegraf, session } from "telegraf";
import { strings } from "./intl/fa";
import { formatStrings } from "./utils";

const proxy = new SocksProxyAgent("socks5://127.0.0.1:10808");

interface SessionData {
  status?: string;
  cnt: number;
}

interface BotContext extends Context {
  session: SessionData;
}

export const MainApp = async (token: string) => {
  const bot = new Telegraf<BotContext>(token, {
    telegram: { agent: proxy },
  });

  bot.use(session({ defaultSession: () => ({ cnt: 0 }) }));

  bot.start(async (ctx) => {
    const chat = ctx.chat;
    if (chat.type !== "private") return;
    const user = (await ctx.getChatMember(chat.id)).user;
    const userName = user.first_name + " " + (user.last_name ?? "");
    ctx.session.cnt++;
    console.log(ctx.session.cnt);
    ctx.reply(formatStrings(strings.start.hi_user, { name: userName }));
  });

  bot.launch();
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
};
