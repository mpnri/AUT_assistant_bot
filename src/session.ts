import { Context, Scenes } from "telegraf";
import { SceneContextScene, SceneSession } from "telegraf/typings/scenes";
import { SessionContext } from "telegraf/typings/session";

export interface SessionData {
  status?: string;
  cnt: number;
  /**
   * @deprecated
   */
  __scenes: any;

  //* send message scene
  messageTemp?: {
    type: "text" | "poll";
    title?: string;
    pollOptions?: string[];
  };
}

export const InitialSessionData: Omit<SessionData, "__scenes"> = {
  cnt: 0,
  messageTemp: undefined,
};

export interface BotContext extends Context {
  session: SessionData;
  //todo: add state?
  // scene: SceneContextScene<BotContext, Scenes.SceneContext>;
  scene: SceneContextScene<BotContext, Scenes.WizardSessionData>;
  wizard: Scenes.WizardContextWizard<BotContext>;
}
