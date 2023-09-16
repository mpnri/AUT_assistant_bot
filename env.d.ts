declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TOKEN?: string;
      DB_URL?: string;
      CHANNEL_ID?: string;
      ADMIN_USERS?: string;
    }
  }
}
export {};
