/// <reference types="vite/client" />
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGODB_URI: string;
    }
  }

  interface ImportMetaEnv {
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

export {}
