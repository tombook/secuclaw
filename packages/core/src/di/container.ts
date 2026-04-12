import 'reflect-metadata';
import { Container, Service } from 'typedi';
import { JsonStore } from '../storage/json-store.js';
import { EventBus } from '../events/index.js';
import { RolesRepository } from '../roles/repository.js';
import { RolesService } from '../roles/service.js';
import { AuditLogRepository } from '../audit/repository.js';
import { AuditLogService } from '../audit/service.js';
import { CapabilitiesRepository } from '../capabilities/repository.js';
import { CapabilitiesService } from '../capabilities/service.js';
import { KpiService } from '../kpi/service.js';
import { SkillLoader } from '../skills/loader.js';
import { MitreLoader } from '../knowledge/mitre/loader.js';
import { ScfLoader } from '../knowledge/scf/loader.js';
import { ChannelManager } from '../channels/channel-manager.js';

@Service({ global: true })
class JsonStoreService {
  private store: JsonStore;
  
  constructor() {
    this.store = new JsonStore('./data/storage');
  }
  
  get instance(): JsonStore {
    return this.store;
  }
}

@Service({ global: true })
class EventBusService {
  private bus: EventBus;
  
  constructor() {
    this.bus = new EventBus();
  }
  
  get instance(): EventBus {
    return this.bus;
  }
}

@Service()
class RolesRepositoryService {
  private repo: RolesRepository;
  
  constructor() {
    this.repo = new RolesRepository(Container.get(JsonStoreService).instance);
  }
  
  get instance(): RolesRepository {
    return this.repo;
  }
}

@Service()
class AuditLogRepositoryService {
  private repo: AuditLogRepository;
  
  constructor() {
    this.repo = new AuditLogRepository(Container.get(JsonStoreService).instance);
  }
  
  get instance(): AuditLogRepository {
    return this.repo;
  }
}

@Service()
class CapabilitiesRepositoryService {
  private repo: CapabilitiesRepository;
  
  constructor() {
    this.repo = new CapabilitiesRepository(Container.get(JsonStoreService).instance);
  }
  
  get instance(): CapabilitiesRepository {
    return this.repo;
  }
}

@Service()
class RolesServiceService {
  private service: RolesService;
  
  constructor() {
    this.service = new RolesService(Container.get(RolesRepositoryService).instance);
  }
  
  get instance(): RolesService {
    return this.service;
  }
}

@Service()
class AuditLogServiceService {
  private service: AuditLogService;
  
  constructor() {
    this.service = new AuditLogService(Container.get(AuditLogRepositoryService).instance);
  }
  
  get instance(): AuditLogService {
    return this.service;
  }
}

@Service()
class CapabilitiesServiceService {
  private service: CapabilitiesService;
  
  constructor() {
    this.service = new CapabilitiesService(Container.get(CapabilitiesRepositoryService).instance);
  }
  
  get instance(): CapabilitiesService {
    return this.service;
  }
}

@Service()
class KpiServiceService {
  private service: KpiService;
  
  constructor() {
    this.service = new KpiService(Container.get(JsonStoreService).instance);
  }
  
  get instance(): KpiService {
    return this.service;
  }
}

@Service()
class SkillLoaderService {
  private loader: SkillLoader;
  
  constructor() {
    this.loader = new SkillLoader('./skills');
  }
  
  get instance(): SkillLoader {
    return this.loader;
  }
}

@Service()
class MitreLoaderService {
  private loader: MitreLoader;
  
  constructor() {
    this.loader = new MitreLoader('./data/mitre/attack-stix-data');
  }
  
  get instance(): MitreLoader {
    return this.loader;
  }
}

@Service()
class ScfLoaderService {
  private loader: ScfLoader;
  
  constructor() {
    this.loader = new ScfLoader('./data/scf');
  }
  
  get instance(): ScfLoader {
    return this.loader;
  }
}

@Service()
class ChannelManagerService {
  private manager: ChannelManager;
  
  constructor() {
    this.manager = new ChannelManager(Container.get(JsonStoreService).instance);
  }
  
  get instance(): ChannelManager {
    return this.manager;
  }
}

export {
  Container,
  JsonStoreService,
  EventBusService,
  RolesRepositoryService,
  AuditLogRepositoryService,
  CapabilitiesRepositoryService,
  RolesServiceService,
  AuditLogServiceService,
  CapabilitiesServiceService,
  KpiServiceService,
  SkillLoaderService,
  MitreLoaderService,
  ScfLoaderService,
  ChannelManagerService,
};
