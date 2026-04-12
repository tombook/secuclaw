import 'reflect-metadata';
import { Service } from 'typedi';
import type { JsonStore } from '../../storage/json-store.js';
import { RolesService } from '../../roles/service.js';
import { RolesRepository } from '../../roles/repository.js';
import { AuditLogService } from '../../audit/service.js';
import { AuditLogRepository } from '../../audit/repository.js';
import { CapabilitiesService } from '../../capabilities/service.js';
import { CapabilitiesRepository } from '../../capabilities/repository.js';
import { KpiService } from '../../kpi/service.js';
import { IncidentsService } from '../../incidents/service.js';
import { IncidentsRepository } from '../../incidents/repository.js';
import { VulnerabilitiesService } from '../../vulnerabilities/service.js';
import { VulnerabilitiesRepository } from '../../vulnerabilities/repository.js';
import { ThreatsService } from '../../threats/service.js';
import { ThreatsRepository } from '../../threats/repository.js';
import { ComplianceService } from '../../compliance/service.js';
import { ComplianceRepository } from '../../compliance/repository.js';
import { AssetsService } from '../../assets/service.js';
import { AssetsRepository } from '../../assets/repository.js';
import { TasksService } from '../../tasks/service.js';
import { TasksRepository } from '../../tasks/repository.js';
import { CommanderService } from '../../commander/service.js';
import { CommanderRepository } from '../../commander/repository.js';

@Service()
export class ServiceFactory {
  private services: Map<string, unknown> = new Map();
  private repositories: Map<string, unknown> = new Map();

  constructor(private store: JsonStore) {}

  getJsonStore(): JsonStore {
    return this.store;
  }

  getRolesRepository(): RolesRepository {
    const key = 'RolesRepository';
    if (!this.repositories.has(key)) {
      this.repositories.set(key, new RolesRepository(this.store));
    }
    return this.repositories.get(key) as RolesRepository;
  }

  getRolesService(): RolesService {
    const key = 'RolesService';
    if (!this.services.has(key)) {
      this.services.set(key, new RolesService(this.getRolesRepository()));
    }
    return this.services.get(key) as RolesService;
  }

  getAuditLogRepository(): AuditLogRepository {
    const key = 'AuditLogRepository';
    if (!this.repositories.has(key)) {
      this.repositories.set(key, new AuditLogRepository(this.store));
    }
    return this.repositories.get(key) as AuditLogRepository;
  }

  getAuditLogService(): AuditLogService {
    const key = 'AuditLogService';
    if (!this.services.has(key)) {
      this.services.set(key, new AuditLogService(this.getAuditLogRepository()));
    }
    return this.services.get(key) as AuditLogService;
  }

  getCapabilitiesRepository(): CapabilitiesRepository {
    const key = 'CapabilitiesRepository';
    if (!this.repositories.has(key)) {
      this.repositories.set(key, new CapabilitiesRepository(this.store));
    }
    return this.repositories.get(key) as CapabilitiesRepository;
  }

  getCapabilitiesService(): CapabilitiesService {
    const key = 'CapabilitiesService';
    if (!this.services.has(key)) {
      this.services.set(key, new CapabilitiesService(this.getCapabilitiesRepository()));
    }
    return this.services.get(key) as CapabilitiesService;
  }

  getKpiService(): KpiService {
    const key = 'KpiService';
    if (!this.services.has(key)) {
      this.services.set(key, new KpiService(this.store));
    }
    return this.services.get(key) as KpiService;
  }

  getIncidentsRepository(): IncidentsRepository {
    const key = 'IncidentsRepository';
    if (!this.repositories.has(key)) {
      this.repositories.set(key, new IncidentsRepository(this.store));
    }
    return this.repositories.get(key) as IncidentsRepository;
  }

  getIncidentsService(): IncidentsService {
    const key = 'IncidentsService';
    if (!this.services.has(key)) {
      this.services.set(key, new IncidentsService(this.getIncidentsRepository()));
    }
    return this.services.get(key) as IncidentsService;
  }

  getVulnerabilitiesRepository(): VulnerabilitiesRepository {
    const key = 'VulnerabilitiesRepository';
    if (!this.repositories.has(key)) {
      this.repositories.set(key, new VulnerabilitiesRepository(this.store));
    }
    return this.repositories.get(key) as VulnerabilitiesRepository;
  }

  getVulnerabilitiesService(): VulnerabilitiesService {
    const key = 'VulnerabilitiesService';
    if (!this.services.has(key)) {
      this.services.set(key, new VulnerabilitiesService(this.getVulnerabilitiesRepository()));
    }
    return this.services.get(key) as VulnerabilitiesService;
  }

  getThreatsRepository(): ThreatsRepository {
    const key = 'ThreatsRepository';
    if (!this.repositories.has(key)) {
      this.repositories.set(key, new ThreatsRepository(this.store));
    }
    return this.repositories.get(key) as ThreatsRepository;
  }

  getThreatsService(): ThreatsService {
    const key = 'ThreatsService';
    if (!this.services.has(key)) {
      this.services.set(key, new ThreatsService(this.getThreatsRepository()));
    }
    return this.services.get(key) as ThreatsService;
  }

  getComplianceRepository(): ComplianceRepository {
    const key = 'ComplianceRepository';
    if (!this.repositories.has(key)) {
      this.repositories.set(key, new ComplianceRepository(this.store));
    }
    return this.repositories.get(key) as ComplianceRepository;
  }

  getComplianceService(): ComplianceService {
    const key = 'ComplianceService';
    if (!this.services.has(key)) {
      this.services.set(key, new ComplianceService(this.getComplianceRepository()));
    }
    return this.services.get(key) as ComplianceService;
  }

  getAssetsRepository(): AssetsRepository {
    const key = 'AssetsRepository';
    if (!this.repositories.has(key)) {
      this.repositories.set(key, new AssetsRepository(this.store));
    }
    return this.repositories.get(key) as AssetsRepository;
  }

  getAssetsService(): AssetsService {
    const key = 'AssetsService';
    if (!this.services.has(key)) {
      this.services.set(key, new AssetsService(this.getAssetsRepository()));
    }
    return this.services.get(key) as AssetsService;
  }

  getTasksRepository(): TasksRepository {
    const key = 'TasksRepository';
    if (!this.repositories.has(key)) {
      this.repositories.set(key, new TasksRepository(this.store));
    }
    return this.repositories.get(key) as TasksRepository;
  }

  getTasksService(): TasksService {
    const key = 'TasksService';
    if (!this.services.has(key)) {
      this.services.set(key, new TasksService(this.getTasksRepository()));
    }
    return this.services.get(key) as TasksService;
  }

  getCommanderRepository(): CommanderRepository {
    const key = 'CommanderRepository';
    if (!this.repositories.has(key)) {
      this.repositories.set(key, new CommanderRepository(this.store));
    }
    return this.repositories.get(key) as CommanderRepository;
  }

  getCommanderService(): CommanderService {
    const key = 'CommanderService';
    if (!this.services.has(key)) {
      this.services.set(key, new CommanderService(this.getCommanderRepository()));
    }
    return this.services.get(key) as CommanderService;
  }
}
