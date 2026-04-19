import 'reflect-metadata';
import { GatewayServer } from './gateway/server.js';
import { SkillLoader } from './skills/loader.js';
import { MitreLoader } from './knowledge/mitre/loader.js';
import { ScfLoader } from './knowledge/scf/loader.js';
import { JsonStore } from './storage/json-store.js';
import { RolesService } from './roles/service.js';
import { RolesRepository } from './roles/repository.js';
import { DataSeedService } from './data-seed.js';
import { KpiService } from './kpi/service.js';
import { KpiScheduler } from './kpi/scheduler.js';
import { EventBus, EventSystem, defaultRuleClasses } from './events/index.js';
import { initRaciEventBridge } from './events/raci-bridge.js';
import { AuditLogRepository } from './audit/repository.js';
import { AuditLogService } from './audit/service.js';
import { initToolTaskService } from './capabilities/tool-task-service.js';
import { initApprovalService } from './capabilities/approval-service.js';
import { initRiskAssessmentService } from './capabilities/risk-assessment-service.js';
import { initReportGenerator } from './capabilities/report-generator.js';
import { CapabilitiesService } from './capabilities/service.js';
import { CapabilitiesRepository } from './capabilities/repository.js';
import { ChannelManager } from './channels/channel-manager.js';
import { ConfigService } from './config/index.js';
import { registerAuthRoutes } from './gateway/routes/auth-routes.js';
import { registerAuditRoutes } from './gateway/routes/audit-routes.js';
import { registerSkillsRoutes } from './gateway/routes/skills-routes.js';
import { registerChannelsRoutes } from './gateway/routes/channels-routes.js';
import { registerCapabilitiesRoutes } from './gateway/routes/capabilities-routes.js';
import { registerKnowledgeRoutes } from './gateway/routes/knowledge-routes.js';
import { registerCommanderRoutes } from './gateway/routes/commander-routes.js';
import { registerIncidentsCrudRoutes, registerVulnerabilitiesCrudRoutes, registerTasksCrudRoutes, registerRolesCrudRoutes } from './gateway/routes/index.js';
import { registerToolRoutes } from './gateway/routes/tools-routes.js';
import { registerRiskRoutes } from './gateway/routes/risk-routes.js';
import { registerReportRoutes } from './gateway/routes/report-routes.js';
import { registerApprovalRoutes } from './gateway/routes/approval-routes.js';
import { registerPlaybookRoutes } from './gateway/routes/playbook-routes.js';
import { registerAiRoutes } from './gateway/routes/ai-routes.js';
import { registerSiemRoutes } from './gateway/routes/siem-routes.js';
import { registerSecurityRoutes } from './gateway/routes/security-routes.js';
import { registerLlmRoutes } from './gateway/routes/llm-routes.js';
import { registerAssetsRoutes } from './gateway/routes/assets-routes.js';
import { registerWarroomRoutes } from './gateway/routes/warroom-routes.js';
import { registerRaciTaskRoutes } from './gateway/routes/raci-task-routes.js';
import { registerAiCollaborationRoutes } from './gateway/routes/ai-collaboration-routes.js';
import { registerDataCenterRoutes } from './gateway/routes/data-center-routes.js';
import { registerVendorRoutes } from './gateway/routes/vendor-routes.js';
import { registerPrivacyRoutes } from './gateway/routes/privacy-routes.js';
import { registerAlertRoutes, registerSoarRoutes } from './gateway/routes/alert-soar-routes.js';
import { registerBcmRoutes } from './gateway/routes/bcm-routes.js';
import { registerThreatIntelRoutes } from './gateway/routes/threat-intel-routes.js';
import { registerMaturityRoutes } from './gateway/routes/maturity-routes.js';
import { registerBudgetRoutes } from './gateway/routes/budget-routes.js';
import { registerAttackPathRoutes } from './gateway/routes/attack-path-routes.js';
import { AssetsService } from './assets/service.js';
import { AssetsRepository } from './assets/repository.js';

const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  debug: (...args: any[]) => console.log('[DEBUG]', ...args),
};

class SecuClawApplication {
  private configService: ConfigService;
  private gateway: GatewayServer;
  private skillLoader: SkillLoader;
  private mitreLoader: MitreLoader;
  private scfLoader: ScfLoader;
  private jsonStore: JsonStore;
  private rolesService: RolesService;
  private dataSeedService: DataSeedService;
  private kpiService: KpiService;
  private kpiScheduler: KpiScheduler;
  private eventBus: EventBus;
  private eventSystem: EventSystem;
  private auditLogService: AuditLogService;
  private assetsService: AssetsService;
  private shutdownHandlers: Array<() => Promise<void>> = [];

  constructor() {
    this.configService = new ConfigService();
    const cfg = this.configService.getAll();
    const storagePath = `${cfg.storage.basePath}/storage`;

    this.jsonStore = new JsonStore(storagePath);
    this.skillLoader = new SkillLoader(cfg.storage.skillsPath);
    this.mitreLoader = new MitreLoader(`${cfg.storage.basePath}/mitre/attack-stix-data`);
    this.scfLoader = new ScfLoader(`${cfg.storage.basePath}/scf`);

    const rolesRepo = new RolesRepository(this.jsonStore);
    this.rolesService = new RolesService(rolesRepo);

    const assetsRepo = new AssetsRepository(this.jsonStore);
    this.assetsService = new AssetsService(assetsRepo);

    this.dataSeedService = new DataSeedService(this.jsonStore);
    this.kpiService = new KpiService(this.jsonStore);
    this.eventBus = new EventBus();
    this.eventSystem = new EventSystem(this.eventBus);
    for (const RuleClass of defaultRuleClasses) {
      this.eventSystem.registerRule(new RuleClass());
    }
    initRaciEventBridge(this.eventBus, this.jsonStore);
    this.kpiScheduler = new KpiScheduler(this.kpiService, { autoStart: false });

    const auditRepo = new AuditLogRepository(this.jsonStore);
    this.auditLogService = new AuditLogService(auditRepo);

    this.gateway = new GatewayServer({
      port: cfg.gateway.port,
      skillLoader: this.skillLoader,
      mitreLoader: this.mitreLoader,
      scfLoader: this.scfLoader,
      jsonStore: this.jsonStore,
      kpiService: this.kpiService,
      rolesService: this.rolesService,
      eventBus: this.eventBus,
    });
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

    logger.info('Initializing CapabilitiesService & ChannelManager...');
    const capsRepo = new CapabilitiesRepository(this.jsonStore);
    const capsService = new CapabilitiesService(capsRepo);
    capsService.setEventBus(this.eventBus);
    this.gateway.getRouter().setCapabilitiesService(capsService);

    const channelMgr = new ChannelManager(this.jsonStore);
    this.gateway.getRouter().setChannelManager(channelMgr);

    this.gateway.getRouter().setDeps({
      jsonStore: this.jsonStore,
      skillLoader: this.skillLoader,
      mitreLoader: this.mitreLoader,
      scfLoader: this.scfLoader,
      assetsService: this.assetsService,
    });

    logger.info('Registering gateway routes...');
    registerAuthRoutes(this.gateway.getRouter());
    registerAuditRoutes(this.gateway.getRouter());
    registerSkillsRoutes(this.gateway.getRouter());
    registerChannelsRoutes(this.gateway.getRouter());
    registerCapabilitiesRoutes(this.gateway.getRouter());

    const deps = this.gateway.getRouter().getDeps();
    const handlersMap = new Map();

    registerKnowledgeRoutes(handlersMap, deps);
    registerCommanderRoutes(handlersMap, deps);
    registerIncidentsCrudRoutes(handlersMap, deps);
    registerVulnerabilitiesCrudRoutes(handlersMap, deps);
    registerTasksCrudRoutes(handlersMap, deps);
    registerRolesCrudRoutes(handlersMap, deps);
    registerToolRoutes(handlersMap, deps);
    registerRiskRoutes(handlersMap, deps);
    registerReportRoutes(handlersMap, deps);
    registerApprovalRoutes(handlersMap, deps);
    registerPlaybookRoutes(handlersMap, deps);
    registerAiRoutes(handlersMap, deps);
    registerSiemRoutes(handlersMap, { store: deps.jsonStore });
    registerSecurityRoutes(handlersMap, deps);
    registerLlmRoutes(handlersMap, deps);
    registerAssetsRoutes(handlersMap, { ...deps, assetsService: this.assetsService });
    registerWarroomRoutes(handlersMap, deps);
    registerRaciTaskRoutes(handlersMap, deps);
  registerAiCollaborationRoutes(handlersMap, deps);
  registerDataCenterRoutes(handlersMap, deps);
  registerVendorRoutes(handlersMap, deps);
  registerPrivacyRoutes(handlersMap, deps);
  registerAlertRoutes(handlersMap, deps);
  registerSoarRoutes(handlersMap, deps);
  registerBcmRoutes(handlersMap, deps);
  registerThreatIntelRoutes(handlersMap, deps);
  registerMaturityRoutes(handlersMap, deps);
  registerBudgetRoutes(handlersMap, deps);
  registerAttackPathRoutes(handlersMap, deps);

    this.gateway.getRouter().setHandlersFromMap(handlersMap);
    logger.info(`Registered ${this.gateway.getRouter().getMethodCount()} gateway methods`);

    this.gateway.getRouter().initLateRoutes();
    logger.info('CapabilitiesService & ChannelManager initialized');

    this.kpiScheduler.start();
    this.shutdownHandlers.push(() => Promise.resolve(this.kpiScheduler.stop()));

    logger.info('Starting unified gateway server...');
    await this.gateway.start();
    this.shutdownHandlers.push(() => this.gateway.stop());

    const gatewayPort = this.configService.get('gateway').port;
    logger.info(`Ready to accept WebSocket connections at ws://127.0.0.1:${gatewayPort}/ws`);
    logger.info(`Health Check available at http://127.0.0.1:${gatewayPort}/health`);
    logger.info(`REST API available at http://127.0.0.1:${gatewayPort}/api/v1`);

    logger.info('SecuClaw application initialized successfully');

    await this.auditLogService.log({
      action: 'configure',
      resource: 'system',
      resourceId: 'secuclaw-app',
      actor: 'system',
      details: { gatewayPort },
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
  const configService = new ConfigService();
  const app = new SecuClawApplication();
  app.setupSignalHandlers();

  try {
    await app.initialize();
    const gatewayPort = configService.get('gateway').port;
    logger.info('='.repeat(50));
    logger.info('SecuClaw Core Services Started');
    logger.info(`Unified Gateway:  ws://127.0.0.1:${gatewayPort}/ws`);
    logger.info(`Health Check:     http://127.0.0.1:${gatewayPort}/health`);
    logger.info(`REST API:         http://127.0.0.1:${gatewayPort}/api/v1`);
    logger.info('='.repeat(50));
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

main();
