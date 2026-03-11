import { GatewayServer } from './gateway/server.js';
import { SkillLoader } from './skills/loader.js';
import { MitreLoader } from './knowledge/mitre/loader.js';
import { ScfLoader } from './knowledge/scf/loader.js';
import { JsonStore } from './storage/json-store.js';

const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  debug: (...args: any[]) => console.log('[DEBUG]', ...args),
};

interface AppConfig {
  gatewayPort: number;
  databasePath: string;
  skillsPath: string;
  dataPath: string;
}

const config: AppConfig = {
  gatewayPort: parseInt(process.env.GATEWAY_PORT || '21981', 10),
  databasePath: process.env.DATABASE_PATH || './data/secuclaw.db',
  skillsPath: process.env.SKILLS_PATH || './skills',
  dataPath: process.env.DATA_PATH || './data',
};

class SecuClawApplication {
  private gateway: GatewayServer;
  private skillLoader: SkillLoader;
  private mitreLoader: MitreLoader;
  private scfLoader: ScfLoader;
  private jsonStore: JsonStore;
  private shutdownHandlers: Array<() => Promise<void>> = [];

  constructor(config: AppConfig) {
    this.jsonStore = new JsonStore('./data/storage');
    this.skillLoader = new SkillLoader(config.skillsPath);
    this.mitreLoader = new MitreLoader(`${config.dataPath}/mitre/attack-stix-data`);
    this.scfLoader = new ScfLoader(`${config.dataPath}/scf`);
    this.gateway = new GatewayServer({
      port: config.gatewayPort,
      skillLoader: this.skillLoader,
      mitreLoader: this.mitreLoader,
      scfLoader: this.scfLoader,
      jsonStore: this.jsonStore,
    });
  }

  async initialize(): Promise<void> {
    logger.info('Initializing SecuClaw application...');

    // Load skills
    logger.info('Loading skills...');
    await this.skillLoader.loadAll();
    logger.info(`Loaded ${Object.keys(this.skillLoader.getAll()).length} skills`);

    // Load MITRE ATT&CK data
    logger.info('Loading MITRE ATT&CK data...');
    await this.mitreLoader.loadAll();
    const mitreStats = this.mitreLoader.getStats();
    logger.info(`Loaded MITRE: ${mitreStats.techniques} techniques, ${mitreStats.tactics} tactics`);

    // Load SCF data
    logger.info('Loading SCF data...');
    await this.scfLoader.load();
    const scfStats = this.scfLoader.getStats();
    logger.info(`Loaded SCF: ${scfStats.controls} controls, ${scfStats.domains} domains`);

    // Start gateway server
    logger.info('Starting gateway server...');
    await this.gateway.start();
    this.shutdownHandlers.push(() => this.gateway.stop());

    logger.info('SecuClaw application initialized successfully');
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down SecuClaw application...');

    for (const handler of this.shutdownHandlers) {
      try {
        await handler();
      } catch (error) {
        logger.error('Error during shutdown:', error);
      }
    }

    logger.info('Shutdown complete');
  }

  setupSignalHandlers(): void {
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, initiating graceful shutdown...`);
        await this.shutdown();
        process.exit(0);
      });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      this.shutdown().then(() => process.exit(1));
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection:', reason);
    });
  }
}

// Main entry point
async function main() {
  const app = new SecuClawApplication(config);
  app.setupSignalHandlers();

  try {
    await app.initialize();
    logger.info(`Gateway server running on port ${config.gatewayPort}`);
    logger.info('Ready to accept connections at ws://127.0.0.1:21981/ws');
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

main();
