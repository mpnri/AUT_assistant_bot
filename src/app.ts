import { SocksProxyAgent } from "socks-proxy-agent";
import { Context, Markup, Telegraf, session } from "telegraf";
import { strings } from "./intl/fa";
import { usePrisma } from "./db";
import { BotContext } from "./session";
import { BotStage, ScenesIDs, goToMainScene } from "./scenes";

const proxy = new SocksProxyAgent("socks5://127.0.0.1:10808");
const prisma = usePrisma();

const MainApp = async (token: string) => {
  const bot = new Telegraf<BotContext>(token, {
    telegram: { agent: proxy },
  });

  bot.use(session());
  bot.use(BotStage.middleware());

  bot.start(async (ctx) => {
    const chat = ctx.chat;
    // console.log(chat);
    // console.log(ctx.message);
    if (chat.type !== "private") return;
    console.log("start");
    //* add user to DB if not exist
    await prisma.$transaction(async (tx) => {
      if (!(await tx.user.findUnique({ where: { uid: chat.id } }))) {
        await tx.user.create({
          data: {
            uid: chat.id,
            state: 0,
          },
        });
      }
    });
    // .catch((err) => {
    //   console.log("Transaction Err\n", err);
    // });

    ctx.session.cnt = 0;
    console.log(ctx.session.cnt);
    await ctx.telegram.setMyCommands([{ command: "/start", description: "شروع مجدد بات" }]);
    //todo:
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

//* DB
export const Main = async (token: string) => {
  await prisma.$connect();
  await MainApp(token)
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
};
