// 自动化扫描适配器统一接口
export interface ScannerAdapter {
  // 扫描器唯一标识
  id: string;
  // 扫描器名称
  name: string;
  // 扫描器描述
  description: string;
  // 支持的扫描类型
  supportedTypes: ScanType[];
  // 版本
  version: string;

  // 初始化扫描器
  initialize(config: ScannerConfig): Promise<void>;
  // 执行扫描任务
  scan(target: ScanTarget): Promise<ScanResult>;
  // 获取扫描状态
  getStatus(taskId: string): Promise<ScanStatus>;
  // 取消扫描任务
  cancelScan(taskId: string): Promise<boolean>;
  // 解析扫描报告
  parseReport(report: any): Promise<ParsedVulnerability[]>;
  // 健康检查
  healthCheck(): Promise<boolean>;
}

// 扫描类型
export enum ScanType {
  VULNERABILITY = 'vulnerability',
  PORT = 'port',
  WEB = 'web',
  HOST = 'host',
  CONFIG = 'config',
  MALWARE = 'malware'
}

// 扫描目标
export interface ScanTarget {
  id?: string;
  name?: string;
  // 目标地址，可以是IP、域名、URL、CIDR等
  target: string | string[];
  // 扫描类型
  type: ScanType;
  // 扫描参数
  params?: Record<string, any>;
  // 扫描策略
  policy?: string;
  // 超时时间（秒）
  timeout?: number;
}

// 扫描配置
export interface ScannerConfig {
  apiUrl?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  maxConcurrentScans?: number;
  defaultTimeout?: number;
  extra?: Record<string, any>;
}

// 扫描状态
export interface ScanStatus {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled';
  progress: number;
  startTime?: number;
  endTime?: number;
  message?: string;
  error?: string;
}

// 扫描结果
export interface ScanResult {
  taskId: string;
  status: 'success' | 'failed';
  target: string;
  scanType: ScanType;
  startTime: number;
  endTime: number;
  duration: number;
  // 原始报告数据
  rawReport?: any;
  // 解析后的漏洞列表
  vulnerabilities?: ParsedVulnerability[];
  // 扫描统计
  stats: {
    totalHosts: number;
    openPorts: number;
    vulnerabilitiesFound: number;
    criticalVulnerabilities: number;
    highVulnerabilities: number;
    mediumVulnerabilities: number;
    lowVulnerabilities: number;
  };
  error?: string;
}

// 解析后的漏洞格式（标准化）
export interface ParsedVulnerability {
  // 漏洞唯一标识
  id?: string;
  // 漏洞名称
  name: string;
  // 漏洞描述
  description: string;
  // 漏洞严重程度
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  // CVSS评分
  cvssScore?: number;
  // CVSS版本
  cvssVersion?: string;
  // CVE编号
  cveId?: string;
  // CWE编号
  cweId?: string;
  // 受影响的资产
  asset: {
    ip: string;
    port?: number;
    protocol?: string;
    url?: string;
    hostname?: string;
    os?: string;
    service?: string;
    serviceVersion?: string;
  };
  // 漏洞证明
  proof?: string;
  // 修复建议
  solution?: string;
  // 参考链接
  references?: string[];
  // 发现时间
  discoveredAt: number;
  // 额外信息
  extra?: Record<string, any>;
}

// 扫描器适配器注册表
export class ScannerAdapterRegistry {
  private static adapters: Map<string, ScannerAdapter> = new Map();

  static register(adapter: ScannerAdapter): void {
    ScannerAdapterRegistry.adapters.set(adapter.id, adapter);
  }

  static get(id: string): ScannerAdapter | undefined {
    return ScannerAdapterRegistry.adapters.get(id);
  }

  static list(): ScannerAdapter[] {
    return Array.from(ScannerAdapterRegistry.adapters.values());
  }

  static remove(id: string): boolean {
    return ScannerAdapterRegistry.adapters.delete(id);
  }
}
