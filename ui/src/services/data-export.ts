/**
 * SecuClaw Data Export Service
 * Multi-format data export with filtering, scheduling, and API integration
 */

export interface ExportConfig {
  format: 'pdf' | 'csv' | 'json' | 'xlsx' | 'xml' | 'html' | 'markdown';
  dataType: 'incidents' | 'vulnerabilities' | 'compliance' | 'threats' | 'audit-logs' | 'metrics' | 'full-report';
  filters?: ExportFilters;
  options?: ExportOptions;
  destination: ExportDestination;
  schedule?: ExportSchedule;
}

export interface ExportFilters {
  dateRange?: { start: string; end: string };
  severity?: string[];
  status?: string[];
  categories?: string[];
  tags?: string[];
  search?: string;
  limit?: number;
}

export interface ExportOptions {
  includeMetadata: boolean;
  includeCharts: boolean;
  includeRawData: boolean;
  includeSummary: boolean;
  includeRecommendations: boolean;
  anonymizePII: boolean;
  compression?: 'none' | 'zip' | 'gzip';
}

export interface ExportDestination {
  type: 'download' | 'email' | 's3' | 'sharepoint' | 'webhook';
  config: Record<string, string>;
}

export interface ExportSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  recipients?: string[];
}

export interface ExportJob {
  id: string;
  config: ExportConfig;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: Partial<ExportConfig>;
}

export class DataExportService {
  private jobs: Map<string, ExportJob> = new Map();
  private templates: ExportTemplate[] = [
    { id: 'exec-summary', name: 'Executive Summary', description: 'High-level metrics for leadership', icon: '📊', config: { format: 'pdf', dataType: 'metrics' } },
    { id: 'incident-report', name: 'Incident Report', description: 'Detailed incident analysis', icon: '🚨', config: { format: 'pdf', dataType: 'incidents' } },
    { id: 'compliance-audit', name: 'Compliance Audit', description: 'Compliance status for auditors', icon: '✅', config: { format: 'xlsx', dataType: 'compliance' } },
    { id: 'threat-analysis', name: 'Threat Analysis', description: 'Threat intel and IOC list', icon: '🎯', config: { format: 'json', dataType: 'threats' } },
  ];
  private listeners: Set<(event: ExportEvent) => void> = new Set();

  getTemplates(): ExportTemplate[] { return [...this.templates]; }

  async createExport(config: ExportConfig): Promise<ExportJob> {
    const job: ExportJob = {
      id: `export-${Date.now()}`,
      config,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString()
    };
    this.jobs.set(job.id, job);
    this.emit({ type: 'job-created', payload: job });
    this.processExport(job.id);
    return job;
  }

  private async processExport(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.status = 'processing';
    this.emit({ type: 'job-started', payload: job });

    try {
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(r => setTimeout(r, 150));
        job.progress = i;
        this.emit({ type: 'job-progress', payload: { jobId, progress: i } });
      }
      const blob = new Blob([this.generateContent(job)], { type: this.getMimeType(job.config.format) });
      job.downloadUrl = URL.createObjectURL(blob);
      job.fileSize = blob.size;
      job.fileName = `secuclaw-${job.config.dataType}-${new Date().toISOString().split('T')[0]}.${job.config.format}`;
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      this.emit({ type: 'job-completed', payload: job });
    } catch (error) {
      job.status = 'failed';
      job.completedAt = new Date().toISOString();
      this.emit({ type: 'job-failed', payload: job });
    }
  }

  private generateContent(job: ExportJob): string {
    const data = this.getMockData(job.config.dataType);
    switch (job.config.format) {
      case 'json': return JSON.stringify({ metadata: { generated: new Date().toISOString(), type: job.config.dataType }, data }, null, 2);
      case 'csv': return data ? Object.keys(data[0]).join(',') + '\n' + data.map(r => Object.values(r).join(',')).join('\n') : 'No data';
      case 'html': return `<!DOCTYPE html><html><head><title>SecuClaw Export</title></head><body><h1>Security Export</h1><p>Generated: ${new Date().toISOString()}</p><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`;
      case 'markdown': return `# SecuClaw Security Export\n\nGenerated: ${new Date().toISOString()}\n\n## Data\n\n${JSON.stringify(data, null, 2)}`;
      default: return JSON.stringify(data);
    }
  }

  private getMockData(type: string): Record<string, unknown>[] {
    switch (type) {
      case 'incidents': return [{ id: 'INC-001', title: 'Phishing Attack', severity: 'High', status: 'Resolved', created: '2024-04-15' }];
      case 'vulnerabilities': return [{ id: 'VULN-001', name: 'SQL Injection', cvss: 9.8, severity: 'Critical', status: 'Open' }];
      case 'compliance': return [{ control: 'A.1.1', name: 'Security Policy', status: 'Compliant', lastReview: '2024-04-01' }];
      case 'threats': return [{ id: 'IOC-001', type: 'ipv4', value: '185.220.101.134', threatType: 'C2', confidence: 95 }];
      case 'metrics': return [{ metric: 'Threats Blocked', value: 12847, change: '+12.5%' }];
      default: return [{ message: 'Sample data' }];
    }
  }

  private getMimeType(format: string): string {
    const types: Record<string, string> = { json: 'application/json', csv: 'text/csv', html: 'text/html', markdown: 'text/markdown', pdf: 'application/pdf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    return types[format] || 'application/octet-stream';
  }

  getJob(id: string): ExportJob | null { return this.jobs.get(id) || null; }
  getAllJobs(): ExportJob[] { return Array.from(this.jobs.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); }
  cancelJob(id: string): boolean { const job = this.jobs.get(id); if (job && job.status === 'pending') { job.status = 'failed'; return true; } return false; }
  deleteJob(id: string): boolean { const job = this.jobs.get(id); if (job) { if (job.downloadUrl) URL.revokeObjectURL(job.downloadUrl); this.jobs.delete(id); return true; } return false; }

  subscribe(listener: (event: ExportEvent) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private emit(event: ExportEvent) { this.listeners.forEach(l => l(event)); }
}

export interface ExportEvent { type: string; payload: unknown; }

let instance: DataExportService | null = null;
export function getExportService(): DataExportService { if (!instance) instance = new DataExportService(); return instance; }
