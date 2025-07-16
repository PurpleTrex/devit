// Global type declarations for DevIT frontend

declare module 'hast' {
  export interface Node {
    type: string;
    [key: string]: any;
  }
}

declare module 'mdast' {
  export interface Node {
    type: string;
    [key: string]: any;
  }
}

// Additional global types
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_URL: string;
      NEXT_PUBLIC_WS_URL: string;
      NEXT_PUBLIC_APP_NAME: string;
      NEXT_PUBLIC_APP_DESCRIPTION: string;
    }
  }
}

export {};
