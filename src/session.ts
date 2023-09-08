import { Context, Scenes } from "telegraf";
import { SceneContextScene, SceneSession } from "telegraf/typings/scenes";
import { SessionContext } from "telegraf/typings/session";

export interface SessionData {
  status?: string;
  cnt: number;
  __scenes: Scenes.SceneContext;
  //*
  messageTmp?: {
    title: string;
  };
}

export const InitialSessionData: Omit<SessionData, "__scenes"> = {
  cnt: 0,
  messageTmp: undefined,
};

export interface BotContext extends Context {
  session: SessionData;
  scene: SceneContextScene<BotContext, Scenes.SceneContext>;
}
