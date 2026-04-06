import type { JsonStore } from '../storage/json-store.js';

const logger = {
  info: (...args: any[]) => console.log('[ReportGenerator]', ...args),
  error: (...args: any[]) => console.error('[ReportGenerator]', ...args),
  warn: (...args: any[]) => console.warn('[ReportGenerator]', ...args),
  debug: (...args: any[]) => console.log('[ReportGenerator:DEBUG]', ...args),
};

export type ReportType = 'incident' | 'vulnerability' | 'risk' | 'compliance' | 'executive';
export type ReportFormat = 'json' | 'html' | 'pdf' | 'markdown';

export interface ReportSection {
  id: string;
  title: string;
  type: 'text' | 'table' | 'chart' | 'list' | 'image';
  content: any;
  order: number;
}

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  description: string;
  format: ReportFormat;
  sections: ReportSection[];
  generatedAt: number;
  generatedBy: string;
  metadata: Record<string, unknown>;
  content?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  sections: Omit<ReportSection, 'content'>[];
}

export const DEFAULT_REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'incident-summary',
    name: 'Incident Summary Report',
    description: 'Summary of security incidents with timeline and impact',
    type: 'incident',
    sections: [
      { id: 'executive-summary', title: 'Executive Summary', type: 'text', order: 1 },
      { id: 'incident-overview', title: 'Incident Overview', type: 'table', order: 2 },
      { id: 'timeline', title: 'Timeline', type: 'list', order: 3 },
      { id: 'impact-assessment', title: 'Impact Assessment', type: 'text', order: 4 },
      { id: 'lessons-learned', title: 'Lessons Learned', type: 'list', order: 5 },
      { id: 'recommendations', title: 'Recommendations', type: 'list', order: 6 },
    ],
  },
  {
    id: 'vulnerability-report',
    name: 'Vulnerability Report',
    description: 'Comprehensive vulnerability assessment with risk scoring',
    type: 'vulnerability',
    sections: [
      { id: 'scan-summary', title: 'Scan Summary', type: 'table', order: 1 },
      { id: 'critical-vulns', title: 'Critical Vulnerabilities', type: 'table', order: 2 },
      { id: 'high-vulns', title: 'High Vulnerabilities', type: 'table', order: 3 },
      { id: 'risk-matrix', title: 'Risk Matrix', type: 'chart', order: 4 },
      { id: 'remediation-plan', title: 'Remediation Plan', type: 'list', order: 5 },
    ],
  },
  {
    id: 'risk-assessment',
    name: 'Risk Assessment Report',
    description: 'Full risk assessment with mitigation priorities',
    type: 'risk',
    sections: [
      { id: 'executive-overview', title: 'Executive Overview', type: 'text', order: 1 },
      { id: 'risk-summary', title: 'Risk Summary', type: 'chart', order: 2 },
      { id: 'top-risks', title: 'Top Risks', type: 'table', order: 3 },
      { id: 'mitigation-plan', title: 'Mitigation Plan', type: 'list', order: 4 },
    ],
  },
  {
    id: 'compliance-report',
    name: 'Compliance Report',
    description: 'Compliance status and gap analysis',
    type: 'compliance',
    sections: [
      { id: 'compliance-status', title: 'Compliance Status', type: 'table', order: 1 },
      { id: 'gap-analysis', title: 'Gap Analysis', type: 'table', order: 2 },
      { id: 'action-plan', title: 'Action Plan', type: 'list', order: 3 },
    ],
  },
  {
    id: 'executive-dashboard',
    name: 'Executive Dashboard Report',
    description: 'High-level security overview for executives',
    type: 'executive',
    sections: [
      { id: 'security-posture', title: 'Security Posture', type: 'chart', order: 1 },
      { id: 'key-metrics', title: 'Key Metrics', type: 'table', order: 2 },
      { id: 'trend-analysis', title: 'Trend Analysis', type: 'chart', order: 3 },
      { id: 'executive-summary', title: 'Executive Summary', type: 'text', order: 4 },
    ],
  },
];

export class ReportGenerator {
  private reports: Map<string, Report> = new Map();
  private jsonStore: JsonStore | undefined;

  constructor(store?: JsonStore) {
    this.jsonStore = store;
  }

  async initialize(): Promise<void> {
    if (this.jsonStore) {
      try {
        const savedReports = await this.jsonStore.get<Report[]>('reports.json');
        if (savedReports) {
          for (const report of savedReports) {
            this.reports.set(report.id, report);
          }
          logger.info(`Loaded ${savedReports.length} saved reports`);
        }
      } catch (error) {
        logger.warn('Could not load saved reports:', error);
      }
    }
  }

  private async saveReports(): Promise<void> {
    if (this.jsonStore) {
      const reportsArray = Array.from(this.reports.values());
      await this.jsonStore.set('reports.json', reportsArray);
    }
  }

  getTemplates(): ReportTemplate[] {
    return DEFAULT_REPORT_TEMPLATES;
  }

  getTemplate(id: string): ReportTemplate | undefined {
    return DEFAULT_REPORT_TEMPLATES.find(t => t.id === id);
  }

  async generateReport(
    templateId: string,
    reportData: Record<string, unknown>,
    format: ReportFormat,
    generatedBy: string
  ): Promise<Report> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const now = Date.now();
    const sections: ReportSection[] = template.sections.map((section) => ({
      ...section,
      content: this.generateSectionContent(section, reportData),
    }));

    const report: Report = {
      id: `report_${now}_${Math.random().toString(36).substring(2, 11)}`,
      type: template.type,
      title: template.name,
      description: template.description,
      format,
      sections,
      generatedAt: now,
      generatedBy,
      metadata: reportData,
    };

    report.content = this.generateFormattedContent(report);

    this.reports.set(report.id, report);
    await this.saveReports();

    logger.info(`Generated report: ${report.id} (${format})`);
    return report;
  }

  private generateSectionContent(
    section: Omit<ReportSection, 'content'>,
    reportData: Record<string, unknown>
  ): any {
    switch (section.type) {
      case 'text':
        return this.generateTextSection(section, reportData);
      case 'table':
        return this.generateTableSection(section, reportData);
      case 'chart':
        return this.generateChartSection(section, reportData);
      case 'list':
        return this.generateListSection(section, reportData);
      default:
        return { placeholder: 'Content placeholder' };
    }
  }

  private generateTextSection(
    _section: Omit<ReportSection, 'content'>,
    _reportData: Record<string, unknown>
  ): string {
    return 'Text section placeholder';
  }

  private generateTableSection(
    _section: Omit<ReportSection, 'content'>,
    _reportData: Record<string, unknown>
  ): any[] {
    return [{ placeholder: 'Row 1' }, { placeholder: 'Row 2' }];
  }

  private generateChartSection(
    _section: Omit<ReportSection, 'content'>,
    _reportData: Record<string, unknown>
  ): any {
    return { placeholder: 'Chart data' };
  }

  private generateListSection(
    _section: Omit<ReportSection, 'content'>,
    _reportData: Record<string, unknown>
  ): string[] {
    return ['Item 1', 'Item 2', 'Item 3'];
  }

  private generateFormattedContent(report: Report): string {
    switch (report.format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'html':
        return this.generateHtmlReport(report);
      case 'markdown':
        return this.generateMarkdownReport(report);
      case 'pdf':
        return `[PDF Placeholder for report: ${report.id}]`;
      default:
        return JSON.stringify(report, null, 2);
    }
  }

  private generateHtmlReport(report: Report): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>${report.title}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 40px; max-width: 1200px; margin: 0 auto; }
    h1 { color: #1e293b; }
    h2 { color: #475569; margin-top: 32px; }
    .section { margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  <p>${report.description}</p>
  ${report.sections
    .sort((a, b) => a.order - b.order)
    .map(section => `<div class="section"><h2>${section.title}</h2><pre>${JSON.stringify(section.content, null, 2)}</pre></div>`)
    .join('')}
</body>
</html>`;
  }

  private generateMarkdownReport(report: Report): string {
    let markdown = `# ${report.title}\n\n`;
    markdown += `${report.description}\n\n`;
    markdown += `Generated: ${new Date(report.generatedAt).toISOString()}\n\n`;
    markdown += `---\n\n`;

    const sortedSections = [...report.sections].sort((a, b) => a.order - b.order);
    for (const section of sortedSections) {
      markdown += `## ${section.title}\n\n`;
      markdown += `${JSON.stringify(section.content, null, 2)}\n\n`;
    }

    return markdown;
  }

  async getReport(reportId: string): Promise<Report> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }
    return report;
  }

  async listReports(options?: {
    type?: ReportType;
    limit?: number;
    offset?: number;
  }): Promise<Report[]> {
    let reports = Array.from(this.reports.values());

    if (options?.type) {
      reports = reports.filter(r => r.type === options.type);
    }

    reports.sort((a, b) => b.generatedAt - a.generatedAt);

    if (options?.limit) {
      const offset = options.offset || 0;
      reports = reports.slice(offset, offset + options.limit);
    }

    return reports;
  }

  async deleteReport(reportId: string): Promise<void> {
    if (!this.reports.has(reportId)) {
      throw new Error(`Report not found: ${reportId}`);
    }
    this.reports.delete(reportId);
    await this.saveReports();
  }
}

export let reportGenerator: ReportGenerator | undefined;

export function initReportGenerator(store?: JsonStore): ReportGenerator {
  reportGenerator = new ReportGenerator(store);
  return reportGenerator;
}

export function getReportGenerator(): ReportGenerator {
  if (!reportGenerator) {
    throw new Error('ReportGenerator not initialized');
  }
  return reportGenerator;
}
