declare module 'mongodb-memory-server' {
  export interface MongoMemoryServerOpts {
    instance?: {
      port?: number;
      dbPath?: string;
      dbName?: string;
      ip?: string;
      storageEngine?: string;
    };
    binary?: {
      version?: string;
      downloadDir?: string;
      os?: {
        os?: string;
      };
    };
    spawn?: any;
  }

  export class MongoMemoryServer {
    static create(opts?: MongoMemoryServerOpts): Promise<MongoMemoryServer>;
    getUri(): string;
    stop(): Promise<boolean>;
  }
}
