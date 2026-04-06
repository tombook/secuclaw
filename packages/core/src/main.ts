import { GatewayServer } from './gateway/server.js';
import { ApiServer } from './api/server.js';
import { SkillLoader } from './skills/loader.js';
import { MitreLoader } from './knowledge/mitre/loader.js';
import { ScfLoader } from './knowledge/scf/loader.js';
import { JsonStore } from './storage/json-store.js';
import { RolesService } from './roles/service.js';
import { RolesRepository } from './roles/repository.js';
import { DataSeedService } from './data-seed.js';
import { KpiService } from './kpi/service.js';
import { KpiScheduler } from './kpi/scheduler.js';
import { EventBus, registerDefaultRules } from './events/index.js';
import { AuditLogRepository } from './audit/repository.js';
import { AuditLogService } from './audit/service.js';
import { initToolTaskService } from './capabilities/tool-task-service.js';
import { initApprovalService } from './capabilities/approval-service.js';
import { initRiskAssessmentService } from './capabilities/risk-assessment-service.js';
import { initReportGenerator } from './capabilities/report-generator.js';

const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  debug: (...args: any[]) => console.log('[DEBUG]', ...args),
};

interface AppConfig {
  gatewayPort: number;
  apiPort: number;
  databasePath: string;
  skillsPath: string;
  dataPath: string;
}

const config: AppConfig = {
  gatewayPort: parseInt(process.env.GATEWAY_PORT || '21981', 10),
  apiPort: parseInt(process.env.API_PORT || '21982', 10),
  databasePath: process.env.DATABASE_PATH || './data/secuclaw.db',
  skillsPath: process.env.SKILLS_PATH || './skills',
  dataPath: process.env.DATA_PATH || './data',
};

class SecuClawApplication {
  private gateway: GatewayServer;
  private apiServer: ApiServer | null = null;
  private skillLoader: SkillLoader;
  private mitreLoader: MitreLoader;
  private scfLoader: ScfLoader;
  private jsonStore: JsonStore;
  private rolesService: RolesService;
  private dataSeedService: DataSeedService;
  private kpiService: KpiService;
  private kpiScheduler: KpiScheduler;
  private eventBus: EventBus;
  private auditLogService: AuditLogService;
  private shutdownHandlers: Array<() => Promise<void>> = [];

  constructor(config: AppConfig) {
    this.jsonStore = new JsonStore('./data/storage');
    this.skillLoader = new SkillLoader(config.skillsPath);
    this.mitreLoader = new MitreLoader(`${config.dataPath}/mitre/attack-stix-data`);
    this.scfLoader = new ScfLoader(`${config.dataPath}/scf`);
    
    const rolesRepo = new RolesRepository(this.jsonStore);
    this.rolesService = new RolesService(rolesRepo);
    this.dataSeedService = new DataSeedService(this.jsonStore);
    this.kpiService = new KpiService(this.jsonStore);
    this.eventBus = new EventBus();
    registerDefaultRules(this.eventBus);
    this.kpiScheduler = new KpiScheduler(this.kpiService, { autoStart: false });
    
    const auditRepo = new AuditLogRepository(this.jsonStore);
    this.auditLogService = new AuditLogService(auditRepo);
    
    this.gateway = new GatewayServer({
      port: config.gatewayPort,
      skillLoader: this.skillLoader,
      mitreLoader: this.mitreLoader,
      scfLoader: this.scfLoader,
      jsonStore: this.jsonStore,
      kpiService: this.kpiService,
      rolesService: this.rolesService,
      eventBus: this.eventBus,
    });

    // Initialize REST API server
    try {
      this.apiServer = new ApiServer({ port: config.apiPort });
      logger.info(`REST API server configured on port ${config.apiPort}`);
    } catch (error) {
      logger.warn('REST API server initialization failed, continuing without it:', error);
    }
  }

  async initialize(): Promise<void> {
    logger.info('Initializing SecuClaw application...');

    logger.info('Initializing roles...');
    await this.rolesService.initializeRoles();
    logger.info('Roles initialized');

    logger.info('Loading skills...');
    await this.skillLoader.loadAll();
    logger.info(`Loaded ${Object.keys(this.skillLoader.getAll()).length} skills`);

    logger.info('Loading MITRE ATT&CK data...');
    await this.mitreLoader.loadAll();
    const mitreStats = this.mitreLoader.getStats();
    logger.info(`Loaded MITRE: ${mitreStats.techniques} techniques, ${mitreStats.tactics} tactics`);

    logger.info('Loading SCF data...');
    await this.scfLoader.load();
    const scfStats = this.scfLoader.getStats();
    logger.info(`Loaded SCF: ${scfStats.controls} controls, ${scfStats.domains} domains`);

    logger.info('Seeding operational data...');
    await this.dataSeedService.seedAll();

    logger.info('Initializing Phase 1 services...');
    initToolTaskService(this.jsonStore);
    initApprovalService(this.jsonStore);
    initRiskAssessmentService(this.jsonStore);
    initReportGenerator(this.jsonStore);
    logger.info('Phase 1 services initialized');

    this.kpiScheduler.start();
    this.shutdownHandlers.push(() => Promise.resolve(this.kpiScheduler.stop()));

    logger.info('Starting WebSocket gateway server...');
    await this.gateway.start();
    this.shutdownHandlers.push(() => this.gateway.stop());
    logger.info(`Gateway server running on port ${config.gatewayPort}`);

    // Start REST API server
    if (this.apiServer) {
      logger.info('Starting REST API server...');
      await this.apiServer.start();
      this.shutdownHandlers.push(() => this.apiServer?.stop());
      logger.info(`REST API server running on port ${config.apiPort}`);
    }
    logger.info('Ready to accept WebSocket connections at ws://127.0.0.1:21981/ws');
    logger.info('Health Check available at http://127.0.0.1:21981/health');
    if (this.apiServer) {
      logger.info(`REST API available at http://127.0.0.1:${config.apiPort}/api/v1`);
    }

    logger.info('SecuClaw application initialized successfully');

    await this.auditLogService.log({
      action: 'configure',
      resource: 'system',
      resourceId: 'secuclaw-app',
      actor: 'system',
      details: { gatewayPort: config.gatewayPort },
    });
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

async function main() {
  const app = new SecuClawApplication(config);
  app.setupSignalHandlers();

  try {
    await app.initialize();
    logger.info('='.repeat(50));
    logger.info('SecuClaw Core Services Started');
    logger.info(`WebSocket Gateway: ws://127.0.0.1:${config.gatewayPort}/ws`);
    logger.info(`Health Check:     http://127.0.0.1:${config.gatewayPort}/health`);
    logger.info('='.repeat(50));
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

main();
