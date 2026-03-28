import type { JsonStore } from '../storage/json-store.js';

const STORE_KEY = 'incident-links.json';

export interface IncidentLink {
  incidentId: string;
  resourceType: 'vulnerability' | 'asset' | 'threat' | 'compliance';
  resourceId: string;
  linkedAt: number;
  linkedBy?: string;
  autoLinked: boolean;
}

export interface LinkedResources {
  incidentId: string;
  vulnerabilities: string[];
  assets: string[];
  threats: string[];
  compliance: string[];
}

export class LinkStore {
  constructor(private store: JsonStore) {}

  async linkResource(
    incidentId: string,
    resourceType: IncidentLink['resourceType'],
    resourceId: string,
    linkedBy?: string,
    autoLinked = false,
  ): Promise<void> {
    const links = await this.getAll();
    const exists = links.some(
      l => l.incidentId === incidentId && l.resourceType === resourceType && l.resourceId === resourceId,
    );
    if (exists) return;
    links.push({ incidentId, resourceType, resourceId, linkedAt: Date.now(), linkedBy, autoLinked });
    await this.store.set(STORE_KEY, links);
  }

  async unlinkResource(incidentId: string, resourceType: IncidentLink['resourceType'], resourceId: string): Promise<void> {
    const links = await this.getAll();
    const filtered = links.filter(
      l => !(l.incidentId === incidentId && l.resourceType === resourceType && l.resourceId === resourceId),
    );
    await this.store.set(STORE_KEY, filtered);
  }

  async getLinks(incidentId: string): Promise<IncidentLink[]> {
    const links = await this.getAll();
    return links.filter(l => l.incidentId === incidentId);
  }

  async getLinkedResources(incidentId: string): Promise<LinkedResources> {
    const links = await this.getLinks(incidentId);
    return {
      incidentId,
      vulnerabilities: links.filter(l => l.resourceType === 'vulnerability').map(l => l.resourceId),
      assets: links.filter(l => l.resourceType === 'asset').map(l => l.resourceId),
      threats: links.filter(l => l.resourceType === 'threat').map(l => l.resourceId),
      compliance: links.filter(l => l.resourceType === 'compliance').map(l => l.resourceId),
    };
  }

  async getResourcesByType(resourceType: IncidentLink['resourceType'], resourceId: string): Promise<IncidentLink[]> {
    const links = await this.getAll();
    return links.filter(l => l.resourceType === resourceType && l.resourceId === resourceId);
  }

  private async getAll(): Promise<IncidentLink[]> {
    const data = await this.store.get<IncidentLink[]>(STORE_KEY);
    return data ?? [];
  }
}
