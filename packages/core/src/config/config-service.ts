export type Environment = 'development' | 'test' | 'production';

export interface ServerConfig {
  port: number;
  host: string;
  cors: { origin: string[] };
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
}

export interface StorageConfig {
  basePath: string;
}

export interface LlmConfig {
  defaultProvider: string;
  providers: Record<string, { apiKey: string; model: string; baseUrl: string }>;
}

export interface AppConfig {
  env: Environment;
  server: ServerConfig;
  auth: AuthConfig;
  storage: StorageConfig;
  llm: LlmConfig;
  logLevel: string;
}

const DEFAULT_CONFIGS: Record<Environment, Partial<AppConfig>> = {
  development: {
    env: 'development',
    server: { port: 3000, host: 'localhost', cors: { origin: ['http://localhost:5173', 'http://localhost:3000'] } },
    auth: { jwtSecret: 'dev-secret-change-me', jwtExpiresIn: '24h', bcryptRounds: 10 },
    storage: { basePath: './data' },
    llm: {
      defaultProvider: 'openai',
      providers: {
        openai: { apiKey: '', model: 'gpt-4', baseUrl: 'https://api.openai.com/v1' },
      volcengine: { apiKey: '', model: 'ark-code-latest', baseUrl: 'https://ark.cn-beijing.volces.com/api/coding/v3' },
      minimax: { apiKey: '', model: 'MiniMax-M2.7', baseUrl: 'https://api.minimaxi.com/v1' },
      },
    },
    logLevel: 'debug',
  },
  test: {
    env: 'test',
    server: { port: 3001, host: 'localhost', cors: { origin: [] } },
    auth: { jwtSecret: 'test-secret', jwtExpiresIn: '1h', bcryptRounds: 4 },
    storage: { basePath: './test-data' },
    llm: { defaultProvider: 'openai', providers: {} },
    logLevel: 'warn',
  },
  production: {
    env: 'production',
    server: { port: 8080, host: '0.0.0.0', cors: { origin: [] } },
    auth: { jwtSecret: '', jwtExpiresIn: '8h', bcryptRounds: 12 },
    storage: { basePath: '/data/secuclaw' },
    llm: { defaultProvider: 'openai', providers: {} },
    logLevel: 'info',
  },
};

export class ConfigService {
  private config: AppConfig;

  constructor(env?: Environment) {
    const environment = env ?? (process.env.NODE_ENV as Environment) ?? 'development';
    this.config = this.buildConfig(environment);
  }

  get<T extends keyof AppConfig>(key: T): AppConfig[T] {
    return this.config[key];
  }

  getAll(): AppConfig {
    return this.config;
  }

  getEnvironment(): Environment {
    return this.config.env;
  }

  isDevelopment(): boolean {
    return this.config.env === 'development';
  }

  isProduction(): boolean {
    return this.config.env === 'production';
  }

  private buildConfig(env: Environment): AppConfig {
    const defaults = DEFAULT_CONFIGS[env] ?? DEFAULT_CONFIGS.development;

    return {
      env,
      server: {
        ...defaults.server!,
        port: Number(process.env.PORT) || defaults.server!.port,
        host: process.env.HOST ?? defaults.server!.host,
      },
      auth: {
        ...defaults.auth!,
        jwtSecret: process.env.JWT_SECRET ?? defaults.auth!.jwtSecret,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? defaults.auth!.jwtExpiresIn,
          bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || defaults.auth!.bcryptRounds,
      },
      storage: {
          basePath: process.env.DATA_PATH ?? defaults.storage!.basePath,
      },
      llm: {
        ...defaults.llm!,
        defaultProvider: process.env.LLM_DEFAULT_PROVIDER ?? defaults.llm!.defaultProvider,
      },
      logLevel: process.env.LOG_LEVEL ?? defaults.logLevel ?? 'info',
    };
  }
}
