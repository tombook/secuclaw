import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type DeploymentRegion = 'us-east' | 'us-west' | 'eu-west' | 'eu-central' | 'ap-southeast' | 'ap-northeast' | 'cn-north' | 'cn-east' | 'sa-east' | 'me-south' | 'af-south' | 'local';
export type DeploymentStatus = 'active' | 'inactive' | 'maintenance' | 'draining' | 'degraded' | 'failed';
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';
export type HealthCheckMethod = 'http' | 'tcp' | 'grpc' | 'ping' | 'process';

export interface DeploymentNode {
  id: string;
  name: string;
  region: DeploymentRegion;
  status: DeploymentStatus;
  healthStatus: HealthStatus;
  url: string;
  version: string;
  uptimeSeconds: number;
  cpu: number;
  memory: number;
  disk: number;
  activeConnections: number;
  requestsPerMinute: number;
  errorsPerMinute: number;
  lastHealthCheck: number;
  lastHealthMessage: string;
  startedAt: number;
  metadata: Record<string, any>;
}

export interface DeploymentHealthCheck {
  id: string;
  nodeId: string;
  method: HealthCheckMethod;
  target: string;
  intervalMs: number;
  timeoutMs: number;
  retries: number;
  expectedStatus: number | null;
  lastRunAt: number | null;
  lastRunStatus: HealthStatus;
  consecutiveFailures: number;
  active: boolean;
  createdAt: number;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  region: DeploymentRegion | null;
  nodeIds: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'identified' | 'monitoring' | 'resolved' | 'postmortem';
  startedAt: number;
  identifiedAt: number | null;
  resolvedAt: number | null;
  rootCause: string | null;
  remediation: string | null;
  affectedUsers: number;
  communications: Array<{ timestamp: number; message: string; channel: string }>;
  commander: string | null;
  postmortemUrl: string | null;
  tags: string[];
}

export interface Release {
  id: string;
  version: string;
  description: string;
  region: DeploymentRegion | 'all';
  rolloutStrategy: 'canary' | 'blue_green' | 'rolling' | 'immediate';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  progress: number;
  startedAt: number;
  completedAt: number | null;
  rolledBackAt: number | null;
  affectedNodes: string[];
  completedNodes: string[];
  failedNodes: string[];
  rolledBackBy: string | null;
  rollbackReason: string | null;
  changelog: string;
  approvedBy: string;
  metadata: Record<string, any>;
}

export interface DeploymentStats {
  totalNodes: number;
  activeNodes: number;
  byRegion: Record<DeploymentRegion, number>;
  byStatus: Record<DeploymentStatus, number>;
  byHealth: Record<HealthStatus, number>;
  totalRequests: number;
  averageUptime: number;
  openIncidents: number;
  activeIncidents: number;
  recentReleases: number;
  lastRelease: Release | null;
  currentVersion: string;
  versionDistribution: Record<string, number>;
}

const STORE_KEYS = {
  nodes: 'deployment/nodes.json',
  healthChecks: 'deployment/health-checks.json',
  incidents: 'deployment/incidents.json',
  releases: 'deployment/releases.json',
};

function emptyStatusMap(): Record<DeploymentStatus, number> {
  return { active: 0, inactive: 0, maintenance: 0, draining: 0, degraded: 0, failed: 0 };
}
function emptyHealthMap(): Record<HealthStatus, number> {
  return { healthy: 0, warning: 0, critical: 0, unknown: 0 };
}
function emptyRegionMap(): Record<DeploymentRegion, number> {
  return { 'us-east': 0, 'us-west': 0, 'eu-west': 0, 'eu-central': 0, 'ap-southeast': 0, 'ap-northeast': 0, 'cn-north': 0, 'cn-east': 0, 'sa-east': 0, 'me-south': 0, 'af-south': 0, 'local': 0 };
}

export class DeploymentService {
  constructor(private store: JsonStore) {}

  async registerNode(params: { name: string; region: DeploymentRegion; url: string; version: string; metadata?: Record<string, any> }): Promise<DeploymentNode> {
    const node: DeploymentNode = {
      id: this.generateId('node'),
      name: params.name,
      region: params.region,
      status: 'active',
      healthStatus: 'healthy',
      url: params.url,
      version: params.version,
      uptimeSeconds: 0,
      cpu: 0,
      memory: 0,
      disk: 0,
      activeConnections: 0,
      requestsPerMinute: 0,
      errorsPerMinute: 0,
      lastHealthCheck: Date.now(),
      lastHealthMessage: 'node registered',
      startedAt: Date.now(),
      metadata: params.metadata || {},
    };
    const nodes = await this.loadNodes();
    nodes.push(node);
    await this.store.set(STORE_KEYS.nodes, nodes);
    return node;
  }

  async updateNodeMetrics(params: { nodeId: string; cpu: number; memory: number; disk: number; activeConnections: number; requestsPerMinute: number; errorsPerMinute: number; uptimeSeconds: number }): Promise<DeploymentNode | null> {
    const nodes = await this.loadNodes();
    const idx = nodes.findIndex((n) => n.id === params.nodeId);
    if (idx === -1) return null;
    nodes[idx].cpu = params.cpu;
    nodes[idx].memory = params.memory;
    nodes[idx].disk = params.disk;
    nodes[idx].activeConnections = params.activeConnections;
    nodes[idx].requestsPerMinute = params.requestsPerMinute;
    nodes[idx].errorsPerMinute = params.errorsPerMinute;
    nodes[idx].uptimeSeconds = params.uptimeSeconds;
    nodes[idx].lastHealthCheck = Date.now();
    if (params.cpu > 90 || params.memory > 90 || params.disk > 95) {
      nodes[idx].healthStatus = 'critical';
      nodes[idx].lastHealthMessage = `resource exhaustion: cpu=${params.cpu}% mem=${params.memory}% disk=${params.disk}%`;
    } else if (params.cpu > 75 || params.memory > 80 || params.disk > 85) {
      nodes[idx].healthStatus = 'warning';
    } else {
      nodes[idx].healthStatus = 'healthy';
    }
    await this.store.set(STORE_KEYS.nodes, nodes);
    return nodes[idx];
  }

  async setNodeStatus(nodeId: string, status: DeploymentStatus, message: string = ''): Promise<boolean> {
    const nodes = await this.loadNodes();
    const idx = nodes.findIndex((n) => n.id === nodeId);
    if (idx === -1) return false;
    nodes[idx].status = status;
    nodes[idx].lastHealthMessage = message || `status changed to ${status}`;
    nodes[idx].lastHealthCheck = Date.now();
    if (status === 'active') nodes[idx].healthStatus = 'healthy';
    else if (status === 'failed') nodes[idx].healthStatus = 'critical';
    else if (status === 'degraded' || status === 'maintenance' || status === 'draining') nodes[idx].healthStatus = 'warning';
    await this.store.set(STORE_KEYS.nodes, nodes);
    return true;
  }

  async listNodes(filter?: { region?: DeploymentRegion; status?: DeploymentStatus; health?: HealthStatus }): Promise<DeploymentNode[]> {
    let nodes = await this.loadNodes();
    if (filter?.region) nodes = nodes.filter((n) => n.region === filter.region);
    if (filter?.status) nodes = nodes.filter((n) => n.status === filter.status);
    if (filter?.health) nodes = nodes.filter((n) => n.healthStatus === filter.health);
    return nodes;
  }

  async getNode(nodeId: string): Promise<DeploymentNode | null> {
    const nodes = await this.loadNodes();
    return nodes.find((n) => n.id === nodeId) || null;
  }

  async createHealthCheck(params: { nodeId: string; method: HealthCheckMethod; target: string; intervalMs: number; timeoutMs?: number; retries?: number; expectedStatus?: number }): Promise<DeploymentHealthCheck> {
    const check: DeploymentHealthCheck = {
      id: this.generateId('hc'),
      nodeId: params.nodeId,
      method: params.method,
      target: params.target,
      intervalMs: params.intervalMs,
      timeoutMs: params.timeoutMs || 5000,
      retries: params.retries || 3,
      expectedStatus: params.expectedStatus || 200,
      lastRunAt: null,
      lastRunStatus: 'unknown',
      consecutiveFailures: 0,
      active: true,
      createdAt: Date.now(),
    };
    const all = await this.loadHealthChecks();
    all.push(check);
    await this.store.set(STORE_KEYS.healthChecks, all);
    return check;
  }

  async recordHealthCheckResult(checkId: string, success: boolean): Promise<DeploymentHealthCheck | null> {
    const all = await this.loadHealthChecks();
    const idx = all.findIndex((c) => c.id === checkId);
    if (idx === -1) return null;
    all[idx].lastRunAt = Date.now();
    all[idx].lastRunStatus = success ? 'healthy' : 'critical';
    all[idx].consecutiveFailures = success ? 0 : all[idx].consecutiveFailures + 1;
    await this.store.set(STORE_KEYS.healthChecks, all);
    return all[idx];
  }

  async listHealthChecks(nodeId?: string): Promise<DeploymentHealthCheck[]> {
    let checks = await this.loadHealthChecks();
    if (nodeId) checks = checks.filter((c) => c.nodeId === nodeId);
    return checks;
  }

  async createIncident(params: { title: string; description: string; region?: DeploymentRegion; nodeIds?: string[]; severity: Incident['severity']; commander?: string; tags?: string[] }): Promise<Incident> {
    const inc: Incident = {
      id: this.generateId('inc'),
      title: params.title,
      description: params.description,
      region: params.region || null,
      nodeIds: params.nodeIds || [],
      severity: params.severity,
      status: 'open',
      startedAt: Date.now(),
      identifiedAt: null,
      resolvedAt: null,
      rootCause: null,
      remediation: null,
      affectedUsers: 0,
      communications: [],
      commander: params.commander || null,
      postmortemUrl: null,
      tags: params.tags || [],
    };
    const all = await this.loadIncidents();
    all.push(inc);
    if (all.length > 1000) all.splice(0, all.length - 1000);
    await this.store.set(STORE_KEYS.incidents, all);
    return inc;
  }

  async updateIncidentStatus(incidentId: string, status: Incident['status'], rootCause?: string, remediation?: string): Promise<Incident | null> {
    const all = await this.loadIncidents();
    const idx = all.findIndex((i) => i.id === incidentId);
    if (idx === -1) return null;
    all[idx].status = status;
    if (status === 'identified') all[idx].identifiedAt = Date.now();
    if (status === 'resolved') all[idx].resolvedAt = Date.now();
    if (rootCause) all[idx].rootCause = rootCause;
    if (remediation) all[idx].remediation = remediation;
    await this.store.set(STORE_KEYS.incidents, all);
    return all[idx];
  }

  async addIncidentCommunication(incidentId: string, message: string, channel: string): Promise<boolean> {
    const all = await this.loadIncidents();
    const idx = all.findIndex((i) => i.id === incidentId);
    if (idx === -1) return false;
    all[idx].communications.push({ timestamp: Date.now(), message, channel });
    await this.store.set(STORE_KEYS.incidents, all);
    return true;
  }

  async listIncidents(filter?: { status?: Incident['status']; severity?: Incident['severity']; region?: DeploymentRegion; since?: number; limit?: number }): Promise<Incident[]> {
    let incs = await this.loadIncidents();
    if (filter?.status) incs = incs.filter((i) => i.status === filter.status);
    if (filter?.severity) incs = incs.filter((i) => i.severity === filter.severity);
    if (filter?.region) incs = incs.filter((i) => i.region === filter.region);
    if (filter?.since !== undefined) incs = incs.filter((i) => i.startedAt >= filter.since!);
    incs.sort((a, b) => b.startedAt - a.startedAt);
    if (filter?.limit !== undefined) incs = incs.slice(0, filter.limit);
    return incs;
  }

  async startRelease(params: { version: string; description: string; region: DeploymentRegion | 'all'; rolloutStrategy: Release['rolloutStrategy']; changelog: string; approvedBy: string }): Promise<Release> {
    const nodes = await this.listNodes({ status: 'active' });
    const affectedNodes = params.region === 'all' ? nodes.map((n) => n.id) : nodes.filter((n) => n.region === params.region).map((n) => n.id);
    const release: Release = {
      id: this.generateId('rel'),
      version: params.version,
      description: params.description,
      region: params.region,
      rolloutStrategy: params.rolloutStrategy,
      status: 'in_progress',
      progress: 0,
      startedAt: Date.now(),
      completedAt: null,
      rolledBackAt: null,
      affectedNodes,
      completedNodes: [],
      failedNodes: [],
      rolledBackBy: null,
      rollbackReason: null,
      changelog: params.changelog,
      approvedBy: params.approvedBy,
      metadata: {},
    };
    const releases = await this.loadReleases();
    releases.push(release);
    if (releases.length > 500) releases.splice(0, releases.length - 500);
    await this.store.set(STORE_KEYS.releases, releases);
    return release;
  }

  async completeReleaseNode(releaseId: string, nodeId: string, success: boolean): Promise<Release | null> {
    const releases = await this.loadReleases();
    const idx = releases.findIndex((r) => r.id === releaseId);
    if (idx === -1) return null;
    if (success) {
      if (!releases[idx].completedNodes.includes(nodeId)) releases[idx].completedNodes.push(nodeId);
    } else {
      if (!releases[idx].failedNodes.includes(nodeId)) releases[idx].failedNodes.push(nodeId);
    }
    releases[idx].progress = (releases[idx].completedNodes.length + releases[idx].failedNodes.length) / Math.max(1, releases[idx].affectedNodes.length);
    if (releases[idx].completedNodes.length + releases[idx].failedNodes.length >= releases[idx].affectedNodes.length) {
      releases[idx].status = releases[idx].failedNodes.length === 0 ? 'completed' : 'failed';
      releases[idx].completedAt = Date.now();
    }
    await this.store.set(STORE_KEYS.releases, releases);
    return releases[idx];
  }

  async rollbackRelease(releaseId: string, reason: string, rolledBackBy: string): Promise<boolean> {
    const releases = await this.loadReleases();
    const idx = releases.findIndex((r) => r.id === releaseId);
    if (idx === -1) return false;
    releases[idx].status = 'rolled_back';
    releases[idx].rolledBackAt = Date.now();
    releases[idx].rollbackReason = reason;
    releases[idx].rolledBackBy = rolledBackBy;
    await this.store.set(STORE_KEYS.releases, releases);
    return true;
  }

  async listReleases(limit?: number): Promise<Release[]> {
    let releases = await this.loadReleases();
    releases.sort((a, b) => b.startedAt - a.startedAt);
    if (limit !== undefined) releases = releases.slice(0, limit);
    return releases;
  }

  async getStats(): Promise<DeploymentStats> {
    const nodes = await this.loadNodes();
    const incidents = await this.loadIncidents();
    const releases = await this.loadReleases();
    const byStatus = emptyStatusMap();
    const byHealth = emptyHealthMap();
    const byRegion = emptyRegionMap();
    let totalRequests = 0;
    let totalUptime = 0;
    const versionDistribution: Record<string, number> = {};
    for (const n of nodes) {
      byStatus[n.status]++;
      byHealth[n.healthStatus]++;
      byRegion[n.region]++;
      totalRequests += n.requestsPerMinute;
      totalUptime += n.uptimeSeconds;
      versionDistribution[n.version] = (versionDistribution[n.version] || 0) + 1;
    }
    const versionCounts = Object.values(versionDistribution);
    const currentVersion = versionCounts.length > 0 ? Object.entries(versionDistribution).sort((a, b) => b[1] - a[1])[0][0] : 'unknown';
    const openIncidents = incidents.filter((i) => i.status === 'open' || i.status === 'investigating' || i.status === 'identified' || i.status === 'monitoring').length;
    const lastRelease = releases.length > 0 ? releases.sort((a, b) => b.startedAt - a.startedAt)[0] : null;
    return {
      totalNodes: nodes.length,
      activeNodes: byStatus.active,
      byRegion,
      byStatus,
      byHealth,
      totalRequests,
      averageUptime: nodes.length > 0 ? totalUptime / nodes.length : 0,
      openIncidents,
      activeIncidents: openIncidents,
      recentReleases: releases.filter((r) => r.startedAt >= Date.now() - 30 * 86400e3).length,
      lastRelease,
      currentVersion,
      versionDistribution,
    };
  }

  private async loadNodes(): Promise<DeploymentNode[]> { return (await this.store.get<DeploymentNode[]>(STORE_KEYS.nodes)) || []; }
  private async loadHealthChecks(): Promise<DeploymentHealthCheck[]> { return (await this.store.get<DeploymentHealthCheck[]>(STORE_KEYS.healthChecks)) || []; }
  private async loadIncidents(): Promise<Incident[]> { return (await this.store.get<Incident[]>(STORE_KEYS.incidents)) || []; }
  private async loadReleases(): Promise<Release[]> { return (await this.store.get<Release[]>(STORE_KEYS.releases)) || []; }

  private generateId(prefix: string): string {
    return `${prefix}_${randomUUID()}`;
  }
}
