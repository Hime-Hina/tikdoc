/// <reference types="vite/client" />
declare global {
  namespace NodeJS {
    interface ProcessEnv {
    }
  }

  interface ImportMetaEnv {
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

export {}
