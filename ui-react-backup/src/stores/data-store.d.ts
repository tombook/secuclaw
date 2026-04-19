/**
 * SecuClaw Data Store — Zustand
 *
 * Manages cached data: databases, lineage, quality issues, data sources.
 * Migrated from the Lit DataStore singleton to Zustand.
 */
export type DatabaseHealth = 'healthy' | 'warning' | 'error' | 'unknown';
export type DatabaseType = 'business' | 'support' | 'knowledge' | 'organization';
export interface DatabaseInfo {
    id: string;
    name: string;
    nameEn: string;
    type: DatabaseType;
    icon: string;
    color: string;
    description: string;
    recordCount: number;
    lastSync: Date;
    health: DatabaseHealth;
    size: string;
    relatedPages: string[];
}
export interface LineageNode {
    id: string;
    type: 'source' | 'database' | 'consumer';
    name: string;
    icon: string;
    status: 'active' | 'inactive';
}
export interface LineageRelation {
    sourceId: string;
    targetId: string;
    type: 'sync' | 'api' | 'manual';
    frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
    lastSync: Date;
    recordCount: number;
}
export interface LineageGraph {
    nodes: LineageNode[];
    relations: LineageRelation[];
}
export type QualityIssueSeverity = 'critical' | 'high' | 'medium' | 'low';
export type QualityIssueStatus = 'open' | 'investigating' | 'resolved';
export type QualityIssueType = 'missing' | 'duplicate' | 'invalid' | 'outdated';
export interface QualityIssue {
    id: string;
    databaseId: string;
    type: QualityIssueType;
    severity: QualityIssueSeverity;
    description: string;
    affectedRecords: number;
    detectedAt: Date;
    status: QualityIssueStatus;
}
export interface DataSource {
    id: string;
    name: string;
    type: 'database' | 'api' | 'file' | 'stream';
    connection: {
        host?: string;
        port?: number;
        database?: string;
        apiKey?: string;
    };
    status: 'connected' | 'disconnected' | 'error';
    lastSync?: Date;
    syncFrequency: string;
}
interface DataState {
    databases: DatabaseInfo[];
    lineageGraph: LineageGraph | null;
    qualityIssues: QualityIssue[];
    dataSources: DataSource[];
    loading: boolean;
}
interface DataActions {
    loadDatabases: () => Promise<void>;
    loadLineageGraph: () => Promise<void>;
    loadQualityIssues: () => Promise<void>;
    loadDataSources: () => Promise<void>;
    getDatabase: (id: string) => DatabaseInfo | undefined;
    getDatabasesByType: (type: DatabaseType) => DatabaseInfo[];
    getHealthStats: () => Record<DatabaseHealth, number>;
    getDataLineage: (databaseId: string) => {
        sources: string[];
        consumers: string[];
    };
    getQualityIssuesByDatabase: (databaseId: string) => QualityIssue[];
    fixQualityIssue: (issueId: string) => void;
    syncDataSource: (sourceId: string) => void;
}
export type DataStore = DataState & DataActions;
export declare const useDataStore: import("zustand").UseBoundStore<import("zustand").StoreApi<DataStore>>;
export {};
//# sourceMappingURL=data-store.d.ts.map