import { Context, Scenes } from "telegraf";
import { SceneContextScene, SceneSession } from "telegraf/typings/scenes";
import { SessionContext } from "telegraf/typings/session";

export interface SessionData {
  status?: string;
  cnt: number;
  __scenes: any;

  //* send message scene
  messageTemp?: {
    title: string;
  };
}

export const InitialSessionData: Omit<SessionData, "__scenes"> = {
  cnt: 0,
  messageTemp: undefined,
};

export interface BotContext extends Context {
  session: SessionData;
  //todo: add state?
  scene: SceneContextScene<BotContext, Scenes.SceneContext>;
}
