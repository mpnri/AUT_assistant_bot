declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TOKEN?: string;
      DB_URL?: string;
    }
  }
}
export {};