import type { JsonStore } from '../storage/json-store.js';
import type { KpiValue } from './definition-engine.js';

const THRESHOLDS_KEY = 'kpi-thresholds.json';
const ALERTS_KEY = 'kpi-alerts.json';

export type ThresholdCondition = 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between';

export interface ThresholdConfig {
  id: string;
  kpiId: string;
  condition: ThresholdCondition;
  value: number;
  valueUpper?: number;
  severity: 'info' | 'warning' | 'critical';
  cooldownMs: number;
  enabled: boolean;
}

export interface ThresholdAlert {
  id: string;
  thresholdId: string;
  kpiId: string;
  currentValue: number;
  thresholdValue: number;
  severity: ThresholdConfig['severity'];
  triggeredAt: number;
  status: 'active' | 'acknowledged' | 'resolved';
  resolvedAt?: number;
}

export class ThresholdAlertEngine {
  constructor(private store: JsonStore) {}

  async evaluateThreshold(kpiValue: KpiValue): Promise<ThresholdAlert[]> {
    const thresholds = await this.getThresholds();
    const activeThresholds = thresholds.filter(t => t.enabled && t.kpiId === kpiValue.kpiId);
    const newAlerts: ThresholdAlert[] = [];

    for (const threshold of activeThresholds) {
      if (!this.isConditionMet(threshold, kpiValue.value)) continue;
      if (await this.isInCooldown(threshold)) continue;

      const alert: ThresholdAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        thresholdId: threshold.id,
        kpiId: kpiValue.kpiId,
        currentValue: kpiValue.value,
        thresholdValue: threshold.value,
        severity: threshold.severity,
        triggeredAt: Date.now(),
        status: 'active',
      };
      newAlerts.push(alert);
    }

    if (newAlerts.length > 0) {
      const alerts = await this.getAllAlerts();
      alerts.push(...newAlerts);
      await this.store.set(ALERTS_KEY, alerts);
    }

    return newAlerts;
  }

  async createThreshold(config: Omit<ThresholdConfig, 'id'>): Promise<ThresholdConfig> {
    const thresholds = await this.getThresholds();
    const threshold: ThresholdConfig = {
      ...config,
      id: `thr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
    thresholds.push(threshold);
    await this.store.set(THRESHOLDS_KEY, thresholds);
    return threshold;
  }

  async getThresholds(): Promise<ThresholdConfig[]> {
    const raw = await this.store.get<ThresholdConfig[]>(THRESHOLDS_KEY);
    return raw ?? [];
  }

  async deleteThreshold(id: string): Promise<boolean> {
    const thresholds = await this.getThresholds();
    const filtered = thresholds.filter(t => t.id !== id);
    if (filtered.length === thresholds.length) return false;
    await this.store.set(THRESHOLDS_KEY, filtered);
    return true;
  }

  async acknowledgeAlert(alertId: string): Promise<boolean> {
    const alerts = await this.getAllAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (!alert || alert.status !== 'active') return false;
    alert.status = 'acknowledged';
    await this.store.set(ALERTS_KEY, alerts);
    return true;
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    const alerts = await this.getAllAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return false;
    alert.status = 'resolved';
    alert.resolvedAt = Date.now();
    await this.store.set(ALERTS_KEY, alerts);
    return true;
  }

  async getActiveAlerts(kpiId?: string): Promise<ThresholdAlert[]> {
    const alerts = await this.getAllAlerts();
    let active = alerts.filter(a => a.status === 'active');
    if (kpiId) active = active.filter(a => a.kpiId === kpiId);
    return active;
  }

  async getAllAlerts(): Promise<ThresholdAlert[]> {
    const raw = await this.store.get<ThresholdAlert[]>(ALERTS_KEY);
    return raw ?? [];
  }

  private isConditionMet(threshold: ThresholdConfig, value: number): boolean {
    switch (threshold.condition) {
      case 'gt': return value > threshold.value;
      case 'gte': return value >= threshold.value;
      case 'lt': return value < threshold.value;
      case 'lte': return value <= threshold.value;
      case 'eq': return value === threshold.value;
      case 'between': return value >= threshold.value && value <= (threshold.valueUpper ?? threshold.value);
      default: return false;
    }
  }

  private async isInCooldown(threshold: ThresholdConfig): Promise<boolean> {
    const alerts = await this.getAllAlerts();
    const lastAlert = alerts
      .filter(a => a.thresholdId === threshold.id)
      .sort((a, b) => b.triggeredAt - a.triggeredAt)[0];
    if (!lastAlert) return false;
    return (Date.now() - lastAlert.triggeredAt) < threshold.cooldownMs;
  }
}
