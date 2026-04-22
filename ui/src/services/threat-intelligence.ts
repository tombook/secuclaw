/**
 * SecuClaw Threat Intelligence Service
 * Integrates threat feeds, IOC management, and real-time threat correlation
 */

export interface ThreatIndicator {
  id: string;
  type: 'ipv4' | 'ipv6' | 'domain' | 'url' | 'hash-md5' | 'hash-sha1' | 'hash-sha256' | 'email' | 'file';
  value: string;
  threatType: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  firstSeen: string;
  lastSeen: string;
  tags: string[];
  relatedCampaigns: string[];
  description?: string;
}

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  motivation: string[];
  capabilities: string[];
  intendedTargets: string[];
  ttps: string[];
  associatedMalware: string[];
  activeSince: string;
  lastActivity: string;
  confidence: number;
}

export interface ThreatCampaign {
  id: string;
  name: string;
  actor?: ThreatActor;
  startDate: string;
  endDate?: string;
  targetSectors: string[];
  targetRegions: string[];
  techniques: string[];
  malware: string[];
  indicators: ThreatIndicator[];
  iocCount: number;
  status: 'active' | 'monitored' | 'resolved';
}

export interface ThreatIntelReport {
  id: string;
  title: string;
  summary: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  publishedAt: string;
  source: string;
  iocs: ThreatIndicator[];
  mitigations: string[];
  relatedReports: string[];
}

export interface FeedConfig {
  id: string;
  name: string;
  type: 'commercial' | 'osint' | 'government' | 'industry' | 'internal';
  url: string;
  enabled: boolean;
  refreshInterval: number;
  lastSync?: string;
  indicatorCount: number;
}

export class ThreatIntelligenceService {
  private indicators: Map<string, ThreatIndicator> = new Map();
  private actors: Map<string, ThreatActor> = new Map();
  private campaigns: Map<string, ThreatCampaign> = new Map();
  private feeds: Map<string, FeedConfig> = new Map();
  private correlationEngine: CorrelationEngine;
  private listeners: Set<(event: ThreatIntelEvent) => void> = new Set();

  constructor() {
    this.correlationEngine = new CorrelationEngine();
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock threat indicators
    const mockIndicators: ThreatIndicator[] = [
      {
        id: 'ioc-001',
        type: 'ipv4',
        value: '185.220.101.134',
        threatType: 'C2 Server',
        confidence: 95,
        severity: 'critical',
        source: 'AlienVault OTX',
        firstSeen: '2024-04-15T10:30:00Z',
        lastSeen: '2024-04-20T15:45:00Z',
        tags: ['ransomware', 'lockbit', 'apt'],
        relatedCampaigns: ['campaign-001'],
        description: 'Known LockBit 3.0 C2 infrastructure'
      },
      {
        id: 'ioc-002',
        type: 'domain',
        value: 'malware-payload.xyz',
        threatType: 'Malware Distribution',
        confidence: 88,
        severity: 'high',
        source: 'VirusTotal',
        firstSeen: '2024-04-18T08:00:00Z',
        lastSeen: '2024-04-20T12:00:00Z',
        tags: ['phishing', 'credential-theft'],
        relatedCampaigns: ['campaign-002'],
        description: 'Fake login page targeting financial institutions'
      },
      {
        id: 'ioc-003',
        type: 'hash-sha256',
        value: 'a7f3e2b1...',
        threatType: 'Ransomware',
        confidence: 99,
        severity: 'critical',
        source: 'MITRE ATT&CK',
        firstSeen: '2024-04-10T00:00:00Z',
        lastSeen: '2024-04-20T00:00:00Z',
        tags: ['blackcat', 'alphv', 'double-extortion'],
        relatedCampaigns: ['campaign-001'],
        description: 'BlackCat/ALPHV ransomware binary'
      },
      {
        id: 'ioc-004',
        type: 'url',
        value: 'https://evil-c2.net/api/payload',
        threatType: 'C2 Communication',
        confidence: 92,
        severity: 'critical',
        source: 'ThreatFox',
        firstSeen: '2024-04-19T14:20:00Z',
        lastSeen: '2024-04-20T16:00:00Z',
        tags: ['apt29', 'cozy-bear', 'nation-state'],
        relatedCampaigns: ['campaign-003'],
        description: 'APT29 command and control URL'
      }
    ];

    mockIndicators.forEach(ioc => this.indicators.set(ioc.id, ioc));

    // Mock threat actors
    const mockActors: ThreatActor[] = [
      {
        id: 'actor-001',
        name: 'LockBit',
        aliases: ['LockBit 3.0', 'LockBit Black'],
        motivation: ['financial'],
        capabilities: ['ransomware', 'double-extortion', 'ransomware-as-a-service'],
        intendedTargets: ['Healthcare', 'Finance', 'Critical Infrastructure'],
        ttps: ['T1486', 'T1484', 'T1490'],
        associatedMalware: ['LockBit', 'LockBit 2.0', 'LockBit 3.0'],
        activeSince: '2019-09-01',
        lastActivity: '2024-04-20',
        confidence: 95
      },
      {
        id: 'actor-002',
        name: 'APT29',
        aliases: ['Cozy Bear', 'The Dukes', 'Nobellum'],
        motivation: ['espionage'],
        capabilities: ['spear-phishing', 'supply-chain', 'zero-day-exploitation'],
        intendedTargets: ['Government', 'Defense', 'Healthcare Research'],
        ttps: ['T1566', 'T1195', 'T1059'],
        associatedMalware: ['MiniDuke', 'CozyCar', 'WellMess'],
        activeSince: '2008-01-01',
        lastActivity: '2024-04-15',
        confidence: 99
      },
      {
        id: 'actor-003',
        name: 'Lazarus Group',
        aliases: ['Hidden Cobra', 'Zinc', 'Guardians of Peace'],
        motivation: ['financial', 'espionage', 'destruction'],
        capabilities: ['financial-theft', 'destructive-malware', 'cryptocurrency'],
        intendedTargets: ['Banks', 'Cryptocurrency Exchanges', 'Government'],
        ttps: ['T1486', 'T1518', 'T1562'],
        associatedMalware: ['WannaCry', 'BadRabbit', 'TraderTraitor'],
        activeSince: '2007-01-01',
        lastActivity: '2024-04-18',
        confidence: 98
      }
    ];

    mockActors.forEach(actor => this.actors.set(actor.id, actor));

    // Mock feeds
    const mockFeeds: FeedConfig[] = [
      { id: 'feed-001', name: 'AlienVault OTX', type: 'osint', url: 'https://otx.alienvault.com/api/v1/pulses/subscribed', enabled: true, refreshInterval: 300, indicatorCount: 12543 },
      { id: 'feed-002', name: 'VirusTotal', type: 'commercial', url: 'https://www.virustotal.com/api/v3', enabled: true, refreshInterval: 600, indicatorCount: 34210 },
      { id: 'feed-003', name: 'ThreatFox', type: 'osint', url: 'https://threatfox.abuse.ch/api/v1/', enabled: true, refreshInterval: 180, indicatorCount: 8921 },
      { id: 'feed-004', name: 'Abuse.ch URLhaus', type: 'osint', url: 'https://urlhaus-api.abuse.ch/v1/', enabled: true, refreshInterval: 120, indicatorCount: 5672 },
      { id: 'feed-005', name: 'MITRE ATT&CK', type: 'government', url: 'https://attack.mitre.org/api/v1', enabled: true, refreshInterval: 86400, indicatorCount: 892 },
      { id: 'feed-006', name: 'CISA KEV', type: 'government', url: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', enabled: true, refreshInterval: 3600, indicatorCount: 1054 },
    ];

    mockFeeds.forEach(feed => this.feeds.set(feed.id, feed));
  }

  // IOC Management
  async lookupIndicator(value: string): Promise<ThreatIndicator | null> {
    for (const ioc of this.indicators.values()) {
      if (ioc.value.toLowerCase() === value.toLowerCase() || 
          ioc.value.includes(value) || 
          value.includes(ioc.value)) {
        return ioc;
      }
    }
    return null;
  }

  async enrichIndicator(value: string, type: ThreatIndicator['type']): Promise<ThreatIndicator> {
    // Simulate API enrichment
    return new Promise(resolve => {
      setTimeout(() => {
        const enriched: ThreatIndicator = {
          id: `ioc-${Date.now()}`,
          type,
          value,
          threatType: 'Enriched',
          confidence: Math.floor(Math.random() * 30) + 70,
          severity: 'medium',
          source: 'Enrichment Service',
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          tags: [],
          relatedCampaigns: [],
          description: `Enriched indicator: ${value}`
        };
        this.indicators.set(enriched.id, enriched);
        this.emit({ type: 'indicator-enriched', payload: enriched });
        resolve(enriched);
      }, 500);
    });
  }

  async searchIndicators(query: string, filters?: {
    type?: ThreatIndicator['type'];
    severity?: ThreatIndicator['severity'];
    source?: string;
    tag?: string;
  }): Promise<ThreatIndicator[]> {
    let results = Array.from(this.indicators.values());

    if (query) {
      const q = query.toLowerCase();
      results = results.filter(ioc => 
        ioc.value.toLowerCase().includes(q) ||
        ioc.threatType.toLowerCase().includes(q) ||
        ioc.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (filters?.type) {
      results = results.filter(ioc => ioc.type === filters.type);
    }
    if (filters?.severity) {
      results = results.filter(ioc => ioc.severity === filters.severity);
    }
    if (filters?.source) {
      results = results.filter(ioc => ioc.source === filters.source);
    }
    if (filters?.tag) {
      results = results.filter(ioc => ioc.tags.includes(filters.tag));
    }

    return results;
  }

  // Threat Actor Intelligence
  getActor(id: string): ThreatActor | null {
    return this.actors.get(id) || null;
  }

  getAllActors(): ThreatActor[] {
    return Array.from(this.actors.values());
  }

  async getActorByName(name: string): Promise<ThreatActor | null> {
    const q = name.toLowerCase();
    return Array.from(this.actors.values()).find(
      actor => actor.name.toLowerCase().includes(q) ||
              actor.aliases.some(a => a.toLowerCase().includes(q))
    ) || null;
  }

  // Correlation Engine
  correlateIndicators(iocs: ThreatIndicator[]): CorrelationResult {
    return this.correlationEngine.correlate(iocs);
  }

  async analyzeEntity(entityValue: string): Promise<EntityAnalysis> {
    const iocs = await this.searchIndicators(entityValue);
    const actors = Array.from(this.actors.values()).filter(
      actor => actor.name.toLowerCase().includes(entityValue.toLowerCase())
    );

    return {
      entity: entityValue,
      matchedIocs: iocs,
      potentialActors: actors,
      riskScore: this.calculateRiskScore(iocs, actors),
      recommendations: this.generateRecommendations(iocs),
      analyzedAt: new Date().toISOString()
    };
  }

  private calculateRiskScore(iocs: ThreatIndicator[], actors: ThreatActor[]): number {
    let score = 0;
    iocs.forEach(ioc => {
      switch (ioc.severity) {
        case 'critical': score += 40; break;
        case 'high': score += 25; break;
        case 'medium': score += 10; break;
        case 'low': score += 5; break;
      }
      score += ioc.confidence * 0.3;
    });
    actors.forEach(actor => {
      score += actor.confidence * 0.2;
    });
    return Math.min(100, Math.round(score));
  }

  private generateRecommendations(iocs: ThreatIndicator[]): string[] {
    const recommendations: string[] = [];
    const severities = new Set(iocs.map(i => i.severity));
    
    if (severities.has('critical')) {
      recommendations.push('CRITICAL: Block all associated indicators immediately and initiate incident response');
      recommendations.push('Conduct forensic analysis of potentially affected systems');
    }
    if (severities.has('high')) {
      recommendations.push('HIGH: Implement enhanced monitoring for associated indicators');
      recommendations.push('Review and restrict network access to suspicious domains/IPs');
    }
    if (iocs.some(i => i.type === 'hash-sha256')) {
      recommendations.push('Deploy YARA rules for identified malware signatures');
    }
    if (iocs.some(i => i.tags.includes('phishing'))) {
      recommendations.push('Enhance email security controls and user awareness training');
    }
    
    return recommendations;
  }

  // Feed Management
  getFeeds(): FeedConfig[] {
    return Array.from(this.feeds.values());
  }

  async syncFeed(feedId: string): Promise<{ success: boolean; newIndicators: number }> {
    const feed = this.feeds.get(feedId);
    if (!feed) return { success: false, newIndicators: 0 };

    // Simulate feed sync
    return new Promise(resolve => {
      setTimeout(() => {
        feed.lastSync = new Date().toISOString();
        feed.indicatorCount += Math.floor(Math.random() * 10);
        this.emit({ type: 'feed-synced', payload: feed });
        resolve({ success: true, newIndicators: Math.floor(Math.random() * 10) });
      }, 1000);
    });
  }

  // Event System
  subscribe(listener: (event: ThreatIntelEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: ThreatIntelEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  // Statistics
  getStatistics(): ThreatIntelStats {
    const iocs = Array.from(this.indicators.values());
    const actors = Array.from(this.actors.values());
    
    return {
      totalIndicators: iocs.length,
      indicatorsByType: this.groupBy(iocs, 'type'),
      indicatorsBySeverity: this.groupBy(iocs, 'severity'),
      indicatorsBySource: this.groupBy(iocs, 'source'),
      activeThreatActors: actors.filter(a => {
        const lastActivity = new Date(a.lastActivity);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return lastActivity > thirtyDaysAgo;
      }).length,
      activeCampaigns: Array.from(this.campaigns.values()).filter(c => c.status === 'active').length,
      criticalIndicators: iocs.filter(i => i.severity === 'critical').length,
      lastUpdated: new Date().toISOString()
    };
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// Supporting Classes
class CorrelationEngine {
  correlate(iocs: ThreatIndicator[]): CorrelationResult {
    const correlations: IOCCorrelation[] = [];
    const patterns: string[] = [];
    let confidenceScore = 0;

    // Group by campaign
    const byCampaign = this.groupBy(iocs, ioc => ioc.relatedCampaigns);
    Object.entries(byCampaign).forEach(([campaign, campaignIocs]) => {
      if (campaignIocs.length > 1) {
        correlations.push({
          type: 'campaign',
          relatedIndicators: campaignIocs.map(i => i.id),
          description: `Multiple IOCs linked to campaign ${campaign}`,
          confidence: Math.min(95, 50 + campaignIocs.length * 15)
        });
        patterns.push(`Campaign cluster: ${campaignIocs.length} related indicators`);
      }
    });

    // Group by actor
    const byActor = new Map<string, ThreatIndicator[]>();
    iocs.forEach(ioc => {
      // Extract actor from tags
      const actorTags = ioc.tags.filter(t => 
        ['apt', 'lazarus', 'lockbit', 'apt29', 'apt41'].some(a => t.toLowerCase().includes(a))
      );
      actorTags.forEach(tag => {
        const existing = byActor.get(tag) || [];
        existing.push(ioc);
        byActor.set(tag, existing);
      });
    });

    byActor.forEach((actorIocs, actorName) => {
      if (actorIocs.length > 1) {
        correlations.push({
          type: 'actor',
          relatedIndicators: actorIocs.map(i => i.id),
          description: `Multiple IOCs attributed to ${actorName}`,
          confidence: Math.min(90, 40 + actorIocs.length * 20)
        });
        patterns.push(`Actor cluster: ${actorName} with ${actorIocs.length} indicators`);
      }
    });

    confidenceScore = correlations.length > 0 
      ? Math.round(correlations.reduce((sum, c) => sum + c.confidence, 0) / correlations.length)
      : 50;

    return { correlations, patterns, confidenceScore };
  }

  private groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return array.reduce((acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }
}

// Types
export interface ThreatIntelEvent {
  type: string;
  payload: unknown;
  timestamp?: string;
}

export interface CorrelationResult {
  correlations: IOCCorrelation[];
  patterns: string[];
  confidenceScore: number;
}

export interface IOCCorrelation {
  type: 'campaign' | 'actor' | 'technique' | 'infrastructure';
  relatedIndicators: string[];
  description: string;
  confidence: number;
}

export interface EntityAnalysis {
  entity: string;
  matchedIocs: ThreatIndicator[];
  potentialActors: ThreatActor[];
  riskScore: number;
  recommendations: string[];
  analyzedAt: string;
}

export interface ThreatIntelStats {
  totalIndicators: number;
  indicatorsByType: Record<string, number>;
  indicatorsBySeverity: Record<string, number>;
  indicatorsBySource: Record<string, number>;
  activeThreatActors: number;
  activeCampaigns: number;
  criticalIndicators: number;
  lastUpdated: string;
}

// Singleton instance
let threatIntelInstance: ThreatIntelligenceService | null = null;

export function getThreatIntelService(): ThreatIntelligenceService {
  if (!threatIntelInstance) {
    threatIntelInstance = new ThreatIntelligenceService();
  }
  return threatIntelInstance;
}
