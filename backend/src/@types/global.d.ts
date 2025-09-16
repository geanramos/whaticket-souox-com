declare global {
  namespace NodeJS {
    interface Global {
      flowVariables: {
        [key: string]: any;
      };
    }
  }
}

export {};
