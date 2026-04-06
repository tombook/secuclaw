// IOC（Indicator of Compromise）威胁情报接口定义

// IOC类型
export enum IoCType {
  IP = 'ip',
  DOMAIN = 'domain',
  URL = 'url',
  HASH = 'hash',
  EMAIL = 'email',
  FILENAME = 'filename',
  REGISTRY = 'registry',
  CVE = 'cve',
  OTHER = 'other'
}

// IOC严重程度
export enum IoCSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

// IOC来源类型
export enum IoCSourceType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  USER_UPLOAD = 'user_upload',
  THIRD_PARTY_FEED = 'third_party_feed'
}

// IOC实体
export interface IoC {
  id: string;
  // IOC值
  value: string;
  // IOC类型
  type: IoCType;
  // 严重程度
  severity: IoCSeverity;
  // 置信度（0-100）
  confidence: number;
  // 威胁类型
  threatType: string;
  // 威胁家族
  threatFamily?: string;
  // 描述
  description?: string;
  // 参考链接
  references?: string[];
  // TTPs（战术、技术和过程）
  ttps?: string[];
  // 标签
  tags?: string[];
  // 来源
  source: {
    type: IoCSourceType;
    name: string;
    url?: string;
  };
  // 首次发现时间
  firstSeen: number;
  // 最近发现时间
  lastSeen?: number;
  // 过期时间
  expireAt?: number;
  // 是否已失效
  expired: boolean;
  // 命中次数
  hitCount: number;
  // 最后命中时间
  lastHitAt?: number;
  // 是否启用
  enabled: boolean;
  // 创建时间
  createdAt: number;
  // 更新时间
  updatedAt: number;
  // 扩展字段
  extra?: Record<string, any>;
}

// IOC导入请求
export interface IoCImportRequest {
  // 导入的IOC列表
  iocs: Array<Omit<IoC, 'id' | 'createdAt' | 'updatedAt' | 'hitCount' | 'lastHitAt'>>;
  // 来源信息
  source: {
    type: IoCSourceType;
    name: string;
    url?: string;
  };
  // 是否覆盖已存在的IOC
  overwrite?: boolean;
  // 标签
  tags?: string[];
}

// IOC导入结果
export interface IoCImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{
    index: number;
    value: string;
    error: string;
  }>;
  importedIds: string[];
}

// IOC查询参数
export interface IoCQueryParams {
  page?: number;
  pageSize?: number;
  type?: IoCType;
  severity?: IoCSeverity;
  sourceType?: IoCSourceType;
  value?: string;
  threatType?: string;
  tag?: string;
  expired?: boolean;
  enabled?: boolean;
  fromDate?: number;
  toDate?: number;
}

// IOC匹配结果
export interface IoCMatchResult {
  ioc: IoC;
  matchedValue: string;
  matchedAt: number;
  // 匹配到的资产
  asset?: {
    id: string;
    name: string;
    ip: string;
  };
  // 匹配到的日志/事件
  event?: {
    id: string;
    type: string;
    timestamp: number;
  };
  // 匹配上下文
  context?: Record<string, any>;
}
