/**
 * Anomaly Detection API - 异常检测引擎
 * 
 * 实时检测安全指标中的异常行为
 * 支持多种异常类型的智能识别
 */

import type { JsonStore } from '../storage/json-store.js';
import type {
  Anomaly,
  AnomalyFilter,
  AnomalyDetectRequest,
  AnomalyAcknowledgeRequest,
  AnomalyResolveRequest,
  AnomalyType,
  AnomalySeverity,
  AnomalyStatus,
  AnomalyBaseline,
} from './types.js';

const logger = {
  info: (...args: any[]) => console.log('[AnomalyDetection]', ...args),
  error: (...args: any[]) => console.error('[AnomalyDetection]', ...args),
  warn: (...args: any[]) => console.warn('[AnomalyDetection]', ...args),
};

interface HistoricalData {
  metric: string;
  values: number[];
  timestamps: number[];
  baseline?: AnomalyBaseline;
}

/**
 * Anomaly Detection Engine - 异常检测引擎
 */
export class AnomalyDetectionEngine {
  private historicalData: Map<string, HistoricalData> = new Map();
  private sensitivityThresholds = {
    high: { deviation: 1.5, minSamples: 5 },
    medium: { deviation: 2.0, minSamples: 10 },
    low: { deviation: 2.5, minSamples: 15 },
  };

  constructor(private store: JsonStore) {
    this.loadHistoricalData();
  }

  private async loadHistoricalData(): Promise<void> {
    try {
      const data = await this.store.get<Record<string, HistoricalData>>('anomaly-baselines.json');
      if (data) {
        Object.entries(data).forEach(([metric, value]) => {
          this.historicalData.set(metric, value);
        });
      }
    } catch (error) {
      logger.warn('Failed to load historical data:', error);
    }
  }

  private async saveHistoricalData(): Promise<void> {
    const data: Record<string, HistoricalData> = {};
    this.historicalData.forEach((value, key) => {
      data[key] = value;
    });
    await this.store.set('anomaly-baselines.json', data);
  }

  /**
   * 检测异常
   * @param request 异常检测请求
   */
  async detectAnomalies(request: AnomalyDetectRequest): Promise<Anomaly[]> {
    const { context, data, options } = request;
    const anomalies: Anomaly[] = [];
    const sensitivity = options?.sensitivity || 'medium';
    const threshold = this.sensitivityThresholds[sensitivity];

    logger.info(`Detecting anomalies for context: ${context}, sensitivity: ${sensitivity}`);

    try {
      // 1. 检测指标异常
      if (data?.metrics) {
        const metricAnomalies = await this.detectMetricAnomalies(
          data.metrics,
          threshold,
          context
        );
        anomalies.push(...metricAnomalies);
      }

      // 2. 检测事件异常
      if (data?.events) {
        const eventAnomalies = this.detectEventAnomalies(data.events, context);
        anomalies.push(...eventAnomalies);
      }

      // 3. 检测日志异常
      if (data?.logs) {
        const logAnomalies = this.detectLogAnomalies(data.logs, context);
        anomalies.push(...logAnomalies);
      }

      // 保存异常到存储
      if (anomalies.length > 0) {
        await this.saveAnomalies(anomalies);
      }

      return anomalies;

    } catch (error) {
      logger.error('Failed to detect anomalies:', error);
      throw error;
    }
  }

  /**
   * 获取异常列表
   */
  async listAnomalies(filter?: AnomalyFilter): Promise<Anomaly[]> {
    const allAnomalies = await this.store.get<Anomaly[]>('anomalies.json');
    if (!allAnomalies) return [];

    let filtered = [...allAnomalies];

    if (filter) {
      if (filter.types?.length) {
        filtered = filtered.filter(a => filter.types!.includes(a.type));
      }
      if (filter.severities?.length) {
        filtered = filtered.filter(a => filter.severities!.includes(a.severity));
      }
      if (filter.statuses?.length) {
        filtered = filtered.filter(a => filter.statuses!.includes(a.status));
      }
      if (filter.metric) {
        filtered = filtered.filter(a => a.metric === filter.metric);
      }
      if (filter.fromDate) {
        filtered = filtered.filter(a => a.detectedAt >= filter.fromDate!);
      }
      if (filter.toDate) {
        filtered = filtered.filter(a => a.detectedAt <= filter.toDate!);
      }
    }

    return filtered.sort((a, b) => b.detectedAt - a.detectedAt);
  }

  /**
   * 获取单个异常
   */
  async getAnomaly(id: string): Promise<Anomaly | null> {
    const anomalies = await this.listAnomalies();
    return anomalies.find(a => a.id === id) || null;
  }

  /**
   * 确认异常
   */
  async acknowledge(request: AnomalyAcknowledgeRequest): Promise<Anomaly> {
    const { anomalyId, acknowledgedBy, note: _note } = request;
    
    const anomalies = await this.store.get<Anomaly[]>('anomalies.json') || [];
    const index = anomalies.findIndex(a => a.id === anomalyId);
    
    if (index === -1) {
      throw new Error(`Anomaly not found: ${anomalyId}`);
    }

    anomalies[index] = {
      ...anomalies[index],
      status: 'acknowledged',
      acknowledgedBy,
      acknowledgedAt: Date.now(),
    };

    await this.store.set('anomalies.json', anomalies);
    
    logger.info(`Anomaly ${anomalyId} acknowledged by ${acknowledgedBy}`);
    
    return anomalies[index];
  }

  /**
   * 解决异常
   */
  async resolve(request: AnomalyResolveRequest): Promise<Anomaly> {
    const { anomalyId, resolvedBy, resolution, note } = request;
    
    const anomalies = await this.store.get<Anomaly[]>('anomalies.json') || [];
    const index = anomalies.findIndex(a => a.id === anomalyId);
    
    if (index === -1) {
      throw new Error(`Anomaly not found: ${anomalyId}`);
    }

    const status: AnomalyStatus = resolution === 'false_positive' ? 'false_positive' : 'resolved';
    
    anomalies[index] = {
      ...anomalies[index],
      status,
      resolvedBy,
      resolvedAt: Date.now(),
      resolutionNote: note,
    };

    await this.store.set('anomalies.json', anomalies);
    
    logger.info(`Anomaly ${anomalyId} resolved by ${resolvedBy}, resolution: ${resolution}`);
    
    return anomalies[index];
  }

  /**
   * 获取异常统计
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const anomalies = await this.listAnomalies();
    
    const stats = {
      total: anomalies.length,
      active: anomalies.filter(a => a.status === 'active').length,
      acknowledged: anomalies.filter(a => a.status === 'acknowledged').length,
      resolved: anomalies.filter(a => a.status === 'resolved' || a.status === 'false_positive').length,
      bySeverity: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    };

    anomalies.forEach(a => {
      stats.bySeverity[a.severity] = (stats.bySeverity[a.severity] || 0) + 1;
      stats.byType[a.type] = (stats.byType[a.type] || 0) + 1;
    });

    return stats;
  }

  // ==================== Private Detection Methods ====================

  private async detectMetricAnomalies(
    metrics: Record<string, number>,
    threshold: { deviation: number; minSamples: number },
    _context: string
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    for (const [metric, value] of Object.entries(metrics)) {
      // 获取或计算基线
      const baseline = await this.calculateBaseline(metric, value);
      
      // 计算偏离度
      const deviation = Math.abs(value - baseline.value);
      const deviationPercent = baseline.value !== 0 
        ? (deviation / Math.abs(baseline.value)) * 100 
        : 0;

      // 检测是否异常
      if (deviationPercent > threshold.deviation * 20 && baseline.sampleSize >= threshold.minSamples) {
        const severity = this.calculateSeverity(deviationPercent);
        
        anomalies.push({
          id: `anomaly-${metric}-${Date.now()}`,
          type: this.getAnomalyType(metric),
          title: `${this.getMetricDisplayName(metric)}异常`,
          description: `${this.getMetricDisplayName(metric)}当前值为${value}，较基线值${baseline.value}偏离${deviationPercent.toFixed(1)}%。`,
          severity,
          status: 'active',
          metric,
          value,
          baseline,
          deviation,
          deviationPercent,
          context: {
            metric,
            value,
            baseline: baseline.value,
            deviation,
            deviationPercent,
          },
          possibleCauses: this.getPossibleCauses(metric, deviationPercent),
          recommendedActions: this.getRecommendedActions(metric, severity),
          detectedAt: Date.now(),
        });

        // 更新历史数据
        this.updateHistoricalData(metric, value);
      }
    }

    return anomalies;
  }

  private detectEventAnomalies(events: any[], _context: string): Anomaly[] {
    const anomalies: Anomaly[] = [];

    if (events.length === 0) return anomalies;

    // 检测事件数量异常
    const recentTimeWindow = 24 * 60 * 60 * 1000; // 24小时
    const recentEvents = events.filter((e: any) => 
      Date.now() - (e.createdAt || e.timestamp || 0) < recentTimeWindow
    );

    if (recentEvents.length > 20) {
      anomalies.push({
        id: `anomaly-event-spike-${Date.now()}`,
        type: 'event_spike',
        title: '安全事件数量激增',
        description: `过去24小时内检测到${recentEvents.length}个安全事件，数量明显异常。建议立即排查。`,
        severity: this.calculateSeverity(recentEvents.length / 5),
        status: 'active',
        metric: 'incident_count',
        value: recentEvents.length,
        baseline: {
          value: 5,
          deviation: 3,
          upperThreshold: 10,
          lowerThreshold: 1,
          sampleSize: 30,
          calculatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
        },
        deviation: recentEvents.length - 5,
        deviationPercent: ((recentEvents.length - 5) / 5) * 100,
        possibleCauses: [
          '潜在攻击活动',
          '系统故障导致误报',
          '配置变更引入新检测规则',
        ],
        recommendedActions: [
          '分析新增事件特征',
          '检查是否有针对性攻击',
          '评估是否需要调整检测阈值',
        ],
        detectedAt: Date.now(),
      });
    }

    // 检测登录失败异常
    const loginFailures = events.filter((e: any) => 
      e.type === 'login_failure' || e.eventType === 'auth.failed'
    );

    if (loginFailures.length > 10) {
      anomalies.push({
        id: `anomaly-login-failure-${Date.now()}`,
        type: 'login_failure',
        title: '登录失败率异常升高',
        description: `检测到${loginFailures.length}次登录失败，可能存在暴力破解攻击。`,
        severity: 'high',
        status: 'active',
        metric: 'login_failure_count',
        value: loginFailures.length,
        baseline: {
          value: 3,
          deviation: 2,
          upperThreshold: 8,
          lowerThreshold: 0,
          sampleSize: 30,
          calculatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
        },
        deviation: loginFailures.length - 3,
        deviationPercent: ((loginFailures.length - 3) / 3) * 100,
        affectedEntities: loginFailures.slice(0, 5).map((e: any) => ({
          type: 'user',
          id: e.userId || e.target,
          name: e.userId || e.target || '未知用户',
        })),
        possibleCauses: [
          '暴力破解攻击',
          '用户密码遗忘',
          '第三方服务认证失败',
        ],
        recommendedActions: [
          '检查失败登录的源IP',
          '考虑临时锁定可疑账户',
          '启用多因素认证',
        ],
        detectedAt: Date.now(),
      });
    }

    return anomalies;
  }

  private detectLogAnomalies(logs: any[], _context: string): Anomaly[] {
    const anomalies: Anomaly[] = [];

    if (logs.length === 0) return anomalies;

    // 检测错误日志激增
    const errorLogs = logs.filter((l: any) => 
      l.level === 'error' || l.severity === 'error'
    );

    const errorRate = errorLogs.length / logs.length;
    
    if (errorRate > 0.2 && logs.length > 50) {
      anomalies.push({
        id: `anomaly-error-spike-${Date.now()}`,
        type: 'performance',
        title: '错误日志异常增多',
        description: `错误日志占比${(errorRate * 100).toFixed(1)}%，高于正常水平。`,
        severity: 'medium',
        status: 'active',
        metric: 'error_log_rate',
        value: errorLogs.length,
        baseline: {
          value: Math.max(1, logs.length * 0.05),
          deviation: logs.length * 0.03,
          upperThreshold: logs.length * 0.15,
          lowerThreshold: 0,
          sampleSize: 30,
          calculatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
        },
        deviation: errorLogs.length - logs.length * 0.05,
        deviationPercent: errorRate * 100,
        possibleCauses: [
          '系统组件故障',
          '配置错误',
          '资源不足',
        ],
        recommendedActions: [
          '分析错误日志详情',
          '检查系统健康状态',
          '查看是否有服务故障',
        ],
        detectedAt: Date.now(),
      });
    }

    return anomalies;
  }

  private async calculateBaseline(metric: string, currentValue: number): Promise<AnomalyBaseline> {
    const history = this.historicalData.get(metric);
    
    if (history && history.values.length >= 10) {
      const values = history.values.slice(-30); // 使用最近30个数据点
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(
        values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
      );

      return {
        value: mean,
        deviation: stdDev,
        upperThreshold: mean + 2 * stdDev,
        lowerThreshold: Math.max(0, mean - 2 * stdDev),
        sampleSize: values.length,
        calculatedAt: Date.now(),
      };
    }

    // 默认基线
    return {
      value: currentValue * 0.8,
      deviation: currentValue * 0.2,
      upperThreshold: currentValue * 1.2,
      lowerThreshold: currentValue * 0.4,
      sampleSize: history?.values.length || 1,
      calculatedAt: Date.now(),
    };
  }

  private updateHistoricalData(metric: string, value: number): void {
    let history = this.historicalData.get(metric);
    
    if (!history) {
      history = { metric, values: [], timestamps: [] };
    }

    history.values.push(value);
    history.timestamps.push(Date.now());

    // 保留最近100个数据点
    if (history.values.length > 100) {
      history.values = history.values.slice(-100);
      history.timestamps = history.timestamps.slice(-100);
    }

    this.historicalData.set(metric, history);
    this.saveHistoricalData();
  }

  private calculateSeverity(deviationPercent: number): AnomalySeverity {
    if (deviationPercent > 200) return 'critical';
    if (deviationPercent > 100) return 'high';
    if (deviationPercent > 50) return 'medium';
    return 'low';
  }

  private getAnomalyType(metric: string): AnomalyType {
    const typeMap: Record<string, AnomalyType> = {
      'login_failure': 'login_failure',
      'login_failure_count': 'login_failure',
      'incident_count': 'event_spike',
      'cpu': 'resource_usage',
      'memory': 'resource_usage',
      'disk': 'resource_usage',
      'network_in': 'traffic_anomaly',
      'network_out': 'traffic_anomaly',
      'error_rate': 'performance',
      'response_time': 'performance',
    };
    return typeMap[metric] || 'behavioral';
  }

  private getMetricDisplayName(metric: string): string {
    const nameMap: Record<string, string> = {
      'login_failure': '登录失败',
      'login_failure_count': '登录失败次数',
      'incident_count': '安全事件数',
      'cpu': 'CPU使用率',
      'memory': '内存使用率',
      'disk': '磁盘使用率',
      'network_in': '入站流量',
      'network_out': '出站流量',
      'error_rate': '错误率',
      'response_time': '响应时间',
    };
    return nameMap[metric] || metric;
  }

  private getPossibleCauses(metric: string, _deviationPercent: number): string[] {
    if (metric.includes('login')) {
      return ['暴力破解攻击', '凭证填充', '用户密码问题'];
    }
    if (metric.includes('incident')) {
      return ['真实攻击事件', '检测规则调整', '系统误报'];
    }
    if (metric.includes('cpu') || metric.includes('memory')) {
      return ['资源不足', '应用程序泄露', 'DDoS攻击'];
    }
    return ['系统异常', '配置变更', '外部攻击'];
  }

  private getRecommendedActions(_metric: string, severity: AnomalySeverity): string[] {
    const baseActions = ['持续监控相关指标', '记录异常事件'];
    
    if (severity === 'critical' || severity === 'high') {
      baseActions.push('立即通知安全团队', '考虑启动应急响应');
    }
    
    return baseActions;
  }

  private async saveAnomalies(anomalies: Anomaly[]): Promise<void> {
    const existing = await this.store.get<Anomaly[]>('anomalies.json') || [];
    const updated = [...anomalies, ...existing].slice(0, 500); // 保留最近500条
    await this.store.set('anomalies.json', updated);
  }
}
