// 合规报告生成接口定义

// 报告类型
export enum ReportType {
  COMPLIANCE_ASSESSMENT = 'compliance_assessment',
  GAP_ANALYSIS = 'gap_analysis',
  AUDIT_REPORT = 'audit_report',
  RISK_ASSESSMENT = 'risk_assessment',
  VULNERABILITY_REPORT = 'vulnerability_report',
  INCIDENT_RESPONSE = 'incident_response',
  CUSTOM = 'custom'
}

// 报告格式
export enum ReportFormat {
  PDF = 'pdf',
  WORD = 'docx',
  HTML = 'html',
  JSON = 'json',
  CSV = 'csv',
  EXCEL = 'xlsx'
}

// 合规框架类型
export enum ComplianceFramework {
  ISO27001 = 'iso27001',
  GDPR = 'gdpr',
  SOC2 = 'soc2',
  NIST_CSF = 'nist_csf',
  PCI_DSS = 'pci_dss',
  HIPAA = 'hipaa',
  EQUAL_PROTECTION_20 = 'equal_protection_20', // 等保2.0
  CUSTOM = 'custom'
}

// 报告状态
export interface ReportStatus {
  id: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  downloadUrl?: string;
  fileSize?: number;
}

// 报告生成请求
export interface ReportGenerateRequest {
  // 报告名称
  name: string;
  // 报告类型
  type: ReportType;
  // 导出格式
  format: ReportFormat;
  // 合规框架（合规类报告需要）
  framework?: ComplianceFramework;
  // 报告覆盖的时间范围
  timeRange?: {
    start: number;
    end: number;
  };
  // 包含的内容模块
  sections?: ReportSection[];
  // 过滤条件
  filters?: {
    departments?: string[];
    businessLines?: string[];
    assetIds?: string[];
    severity?: ('critical' | 'high' | 'medium' | 'low')[];
  };
  // 报告模板
  template?: string;
  // 自定义参数
  customParams?: Record<string, any>;
  // 是否包含图表
  includeCharts?: boolean;
  // 是否包含敏感数据
  includeSensitiveData?: boolean;
  // 报告语言
  language?: 'zh-CN' | 'en' | 'zh-TW';
}

// 报告章节
export interface ReportSection {
  id: string;
  title: string;
  type: 'overview' | 'metrics' | 'table' | 'chart' | 'text' | 'findings' | 'recommendations' | 'appendix';
  // 章节内容配置
  config?: Record<string, any>;
  // 是否显示
  visible: boolean;
  // 排序
  order: number;
}

// 报告元数据
export interface ReportMetadata {
  id: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  framework?: ComplianceFramework;
  timeRange?: {
    start: number;
    end: number;
  };
  generatedAt: number;
  generatedBy: string;
  fileSize: number;
  downloadCount: number;
  expiresAt?: number;
}

// 报告模板
export interface ReportTemplate {
  id: string;
  name: string;
  type: ReportType;
  framework?: ComplianceFramework;
  description: string;
  sections: ReportSection[];
  defaultFormat: ReportFormat;
  // 模板内容（HTML/Markdown）
  content: string;
  // 封面配置
  cover?: {
    title: string;
    subtitle?: string;
    logo?: string;
    showVersion?: boolean;
    showDate?: boolean;
  };
  // 页眉页脚
  header?: string;
  footer?: string;
  // 样式配置
  styles?: Record<string, any>;
  // 是否为系统默认模板
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

// 报告生成器接口
export interface IReportGenerator {
  // 生成报告
  generate(request: ReportGenerateRequest): Promise<ReportStatus>;
  // 获取报告状态
  getStatus(reportId: string): Promise<ReportStatus | null>;
  // 下载报告
  download(reportId: string): Promise<Buffer | null>;
  // 删除报告
  delete(reportId: string): Promise<boolean>;
  // 列出所有报告
  list(params?: { page?: number; pageSize?: number }): Promise<{ list: ReportMetadata[]; total: number }>;
  // 获取模板列表
  getTemplates(type?: ReportType): Promise<ReportTemplate[]>;
  // 保存自定义模板
  saveTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportTemplate>;
}

// 预定义报告章节配置
export const DEFAULT_REPORT_SECTIONS: Record<ReportType, ReportSection[]> = {
  [ReportType.COMPLIANCE_ASSESSMENT]: [
    { id: 'cover', title: '封面', type: 'overview', visible: true, order: 1 },
    { id: 'summary', title: '执行摘要', type: 'overview', visible: true, order: 2 },
    { id: 'scope', title: '评估范围', type: 'text', visible: true, order: 3 },
    { id: 'methodology', title: '评估方法', type: 'text', visible: true, order: 4 },
    { id: 'compliance_status', title: '合规状态概览', type: 'metrics', visible: true, order: 5 },
    { id: 'framework_score', title: '合规框架得分', type: 'chart', visible: true, order: 6 },
    { id: 'control_assessment', title: '控制项评估结果', type: 'table', visible: true, order: 7 },
    { id: 'gap_analysis', title: '差距分析', type: 'findings', visible: true, order: 8 },
    { id: 'recommendations', title: '整改建议', type: 'recommendations', visible: true, order: 9 },
    { id: 'appendix', title: '附录', type: 'appendix', visible: true, order: 10 }
  ],
  [ReportType.GAP_ANALYSIS]: [],
  [ReportType.AUDIT_REPORT]: [],
  [ReportType.RISK_ASSESSMENT]: [],
  [ReportType.VULNERABILITY_REPORT]: [],
  [ReportType.INCIDENT_RESPONSE]: [],
  [ReportType.CUSTOM]: []
};
