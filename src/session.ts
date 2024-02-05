import { MessageType } from "@prisma/client";
import { Context, Scenes } from "telegraf";

interface MyWizardSession extends Scenes.WizardSessionData {
  //! inside scene session
	//* will be available under `ctx.scene.session.myWizardSessionProp`
	// myWizardSessionProp: number;
}

export interface SessionData extends Scenes.WizardSession<MyWizardSession> {
  status?: string;
  cnt?: number;
  /**
   * @internal
   */
  // __scenes: WizardSessionData;

  //* send message scene
  replyMessageID?: number;
  messageTemp?: {
    type: MessageType;
    title?: string;
    pollOptions?: string[];
  };

  //* show messages scene
  currentMessageTemp?: {
    _id: string;
  };
}

export interface BotContext extends Context {
  session: SessionData;
  // scene: SceneContextScene<BotContext, Scenes.SceneContext>;
  scene: Scenes.SceneContextScene<BotContext, MyWizardSession>;
  wizard: Scenes.WizardContextWizard<BotContext>;
}
