declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TOKEN?: string;
      DB_URL?: string;
      CHANNEL_ID?: string;
      ADMIN_USERS?: string;
      HELPER_CHANNEL_ID?: string;
    }
  }
}
export {};
