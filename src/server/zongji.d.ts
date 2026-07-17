declare module "zongji" {
  import { EventEmitter } from "node:events";

  interface ZongJiOptions {
    host: string;
    user: string;
    password: string;
  }

  interface StartOptions {
    startAtEnd?: boolean;
    includeEvents?: string[];
    includeSchema?: Record<string, boolean>;
  }

  export default class ZongJi extends EventEmitter {
    constructor(options: ZongJiOptions);
    start(options: StartOptions): void;
    stop(): void;
  }
}
