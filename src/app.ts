import { SocksProxyAgent } from "socks-proxy-agent";
import { Telegraf } from "telegraf";

const proxy = new SocksProxyAgent("socks5://127.0.0.1:10808");

export const MainApp = async (token: string) => {
  const bot = new Telegraf(token, {
    telegram: { agent: proxy },
  });

  bot.start(() => {
    console.log("hello");
  });

  bot.launch();
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
};
