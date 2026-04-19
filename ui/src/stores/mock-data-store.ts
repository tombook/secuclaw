/**
 * Mock 数据存储 — 定时刷新模拟实时指标
 * 每 30 秒小幅波动所有角色的指标数值
 */
import { createStore } from 'zustand/vanilla';

export interface MetricState {
  num: string;
  numColor: string;
  sparkData: number[];
  delta: string;
  deltaColor: string;
  badge: string;
  badgeColor: string;
}

export interface RoleMetrics {
  [toolId: string]: MetricState;
}

export interface MockDataState {
  metrics: Record<string, MetricState>;
  lastUpdate: number;
}

// ─── 初始数据 ───

const INIT: Record<string, MetricState> = {
  // CISO
  'risk-score':     { num: '44',  numColor: '#fbbf24', sparkData: [52,48,55,51,47,44,49,46,43,48,45,44], delta: '↑+3',   deltaColor: '#ef4444', badge: 'P2 中', badgeColor: '#f59e0b' },
  'kpi-track':      { num: '85%', numColor: '#3b82f6', sparkData: [78,80,82,81,83,85,84,85],             delta: '↑+7%',  deltaColor: '#22c55e', badge: 'P3 轻', badgeColor: '#22c55e' },
  'board-report':   { num: '2',   numColor: '#f59e0b', sparkData: [3,2,4,2,3,2,1,2],                     delta: '↓-1',   deltaColor: '#22c55e', badge: 'P2 中', badgeColor: '#f59e0b' },
  'budget-dash':    { num: '63%', numColor: '#22c55e', sparkData: [45,50,55,58,60,62,63,63],              delta: '↑+18%', deltaColor: '#f59e0b', badge: 'P3 轻', badgeColor: '#22c55e' },
  'compliance-chk': { num: '91%', numColor: '#3b82f6', sparkData: [85,87,88,89,90,91,91,91],              delta: '↑+6%',  deltaColor: '#22c55e', badge: 'P3 轻', badgeColor: '#22c55e' },
  // Commander
  'global-situation': { num: '58', numColor: '#f59e0b', sparkData: [62,60,57,55,58,56,54,58],            delta: '↑+3',   deltaColor: '#ef4444', badge: 'P2 中', badgeColor: '#f59e0b' },
  'ai-dispatch':      { num: '3',  numColor: '#22c55e', sparkData: [1,2,2,3,2,3,3,3],                    delta: '↑+1',   deltaColor: '#22c55e', badge: 'P3 轻', badgeColor: '#22c55e' },
  'incident-mgmt':    { num: '4',  numColor: '#ef4444', sparkData: [6,5,7,4,5,3,4,4],                    delta: '↓-2',   deltaColor: '#22c55e', badge: 'P1 重', badgeColor: '#ef4444' },
  // Security Ops
  'alert-queue':   { num: '22',  numColor: '#ef4444', sparkData: [28,25,30,22,24,20,22,22],              delta: '↓-3',   deltaColor: '#22c55e', badge: 'P1 重', badgeColor: '#ef4444' },
  'soar-exec':     { num: '5',   numColor: '#3b82f6', sparkData: [3,4,5,4,6,5,4,5],                      delta: '↑+1',   deltaColor: '#f59e0b', badge: 'P3 轻', badgeColor: '#22c55e' },
  'log-analysis':  { num: '156', numColor: '#f59e0b', sparkData: [120,135,145,156,140,150,155,156],       delta: '↑+12',  deltaColor: '#ef4444', badge: 'P2 中', badgeColor: '#f59e0b' },
  // Security Expert
  'vuln-scan':     { num: '65',  numColor: '#ef4444', sparkData: [72,68,70,65,63,60,65,65],               delta: '↑+5',   deltaColor: '#ef4444', badge: 'P1 重', badgeColor: '#ef4444' },
  'threat-intel':  { num: '12',  numColor: '#f59e0b', sparkData: [5,8,6,10,9,12,11,12],                   delta: '↑+4',   deltaColor: '#ef4444', badge: 'P1 重', badgeColor: '#ef4444' },
  'pen-test':      { num: '12',  numColor: '#3b82f6', sparkData: [8,9,10,11,12,12,12,12],                 delta: '→0',    deltaColor: '#64748b', badge: 'P3 轻', badgeColor: '#22c55e' },
  'patch-mgmt':    { num: '8',   numColor: '#f59e0b', sparkData: [12,10,11,8,9,7,8,8],                    delta: '↓-2',   deltaColor: '#22c55e', badge: 'P2 中', badgeColor: '#f59e0b' },
  // Architect
  'threat-model':  { num: '23',  numColor: '#06b6d4', sparkData: [28,25,24,23,22,23,24,23],               delta: '↓-2',   deltaColor: '#22c55e', badge: 'P3 轻', badgeColor: '#22c55e' },
  'iam-config':    { num: '87%', numColor: '#22c55e', sparkData: [82,83,84,85,86,87,87,87],               delta: '↑+3%',  deltaColor: '#22c55e', badge: 'P3 轻', badgeColor: '#22c55e' },
  'zero-trust':    { num: '62%', numColor: '#3b82f6', sparkData: [55,57,58,60,61,62,62,62],               delta: '↑+5%',  deltaColor: '#22c55e', badge: 'P2 中', badgeColor: '#f59e0b' },
  'cloud-security':{ num: '15',  numColor: '#f59e0b', sparkData: [18,17,16,15,14,15,16,15],               delta: '↓-1',   deltaColor: '#22c55e', badge: 'P2 中', badgeColor: '#f59e0b' },
  // Privacy Officer
  'gdpr-audit':    { num: '87%', numColor: '#a78bfa', sparkData: [80,82,83,85,86,87,87,87],               delta: '↑+9%',  deltaColor: '#22c55e', badge: 'P3 轻', badgeColor: '#22c55e' },
  'data-map':      { num: '3',   numColor: '#f59e0b', sparkData: [2,3,3,3,4,3,3,3],                       delta: '↑+1',   deltaColor: '#f59e0b', badge: 'P2 中', badgeColor: '#f59e0b' },
  'policy-mgmt':   { num: '2',   numColor: '#ef4444', sparkData: [1,2,3,2,2,1,2,2],                       delta: '↑+1',   deltaColor: '#f59e0b', badge: 'P1 重', badgeColor: '#ef4444' },
  'vendor-eval':   { num: '1',   numColor: '#ef4444', sparkData: [0,1,2,1,1,0,1,1],                       delta: '→0',    deltaColor: '#64748b', badge: 'P2 中', badgeColor: '#f59e0b' },
  // Business Security
  'bcp-mgmt':      { num: '90%', numColor: '#10b981', sparkData: [85,87,88,89,90,90,91,90],               delta: '↑+2%',  deltaColor: '#22c55e', badge: 'P3 轻', badgeColor: '#22c55e' },
  'cost-calc':     { num: '87%', numColor: '#10b981', sparkData: [80,82,84,85,86,87,87,87],               delta: '↑+7%',  deltaColor: '#22c55e', badge: 'P2 中', badgeColor: '#f59e0b' },
  // Supply Chain
  'sbom-scan':     { num: '3',   numColor: '#84cc16', sparkData: [2,3,4,3,2,3,3,3],                       delta: '→0',    deltaColor: '#64748b', badge: 'P2 中', badgeColor: '#f59e0b' },
  'third-party-risk': { num: '2', numColor: '#f59e0b', sparkData: [1,2,3,2,2,1,2,2],                     delta: '↑+1',   deltaColor: '#f59e0b', badge: 'P2 中', badgeColor: '#f59e0b' },
  'contract-review':  { num: '5', numColor: '#ef4444', sparkData: [3,4,5,6,5,4,5,5],                     delta: '↑+1',   deltaColor: '#f59e0b', badge: 'P1 重', badgeColor: '#ef4444' },
};

// ─── 波动函数 ───

function jitter(val: number, range: number): number {
  return val + Math.round((Math.random() - 0.5) * 2 * range);
}

function numValue(s: string): { base: number; suffix: string } {
  if (s.endsWith('%')) return { base: parseInt(s), suffix: '%' };
  return { base: parseInt(s), suffix: '' };
}

function tickMetrics(metrics: Record<string, MetricState>): Record<string, MetricState> {
  const next: Record<string, MetricState> = {};
  for (const [id, m] of Object.entries(metrics)) {
    const { base, suffix } = numValue(m.num);
    // Small jitter: ±1 for small numbers, ±2-3 for large
    const range = base > 50 ? 3 : base > 10 ? 2 : 1;
    let newBase = jitter(base, range);
    // Clamp percentages
    if (suffix === '%') newBase = Math.max(0, Math.min(100, newBase));
    else newBase = Math.max(0, newBase);

    const newNum = newBase + suffix;

    // Shift sparkline: drop oldest, add new value
    const newSpark = [...m.sparkData.slice(1), base]; // keep raw numeric

    // Recompute delta (compare new vs previous)
    const prev = m.sparkData[m.sparkData.length - 2] ?? base;
    const diff = newBase - prev;
    const deltaSign = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
    const deltaStr = diff === 0 ? '→0' : `${deltaSign}${diff > 0 ? '+' : ''}${diff}${suffix ? '' : ''}`;

    // Adjust delta color based on direction (for risk metrics, up is bad; for compliance, up is good)
    let dc = m.deltaColor;
    if (id.includes('risk') || id.includes('alert') || id.includes('vuln') || id.includes('threat') || id.includes('incident') || id.includes('patch') || id.includes('contract')) {
      dc = diff > 0 ? '#ef4444' : diff < 0 ? '#22c55e' : '#64748b';
    } else if (id.includes('compliance') || id.includes('kpi') || id.includes('budget') || id.includes('bcp') || id.includes('gdpr') || id.includes('iam') || id.includes('zero-trust') || id.includes('cost')) {
      dc = diff > 0 ? '#22c55e' : diff < 0 ? '#ef4444' : '#64748b';
    }

    next[id] = { ...m, num: newNum, sparkData: newSpark, delta: deltaStr, deltaColor: dc };
  }
  return next;
}

// ─── Store ───

export const mockDataStore = createStore<MockDataState>((set) => ({
  metrics: { ...INIT },
  lastUpdate: Date.now(),
}));

// ─── Auto-refresh every 30s ───

let _timer: ReturnType<typeof setInterval> | null = null;

export function startMockDataRefresh(intervalMs = 30000) {
  if (_timer) return;
  _timer = setInterval(() => {
    const state = mockDataStore.getState();
    mockDataStore.setState({
      metrics: tickMetrics(state.metrics),
      lastUpdate: Date.now(),
    });
  }, intervalMs);
}

export function stopMockDataRefresh() {
  if (_timer) { clearInterval(_timer); _timer = null; }
}

/** Get metric state for a toolId, with fallback */
export function getMetric(toolId: string): MetricState | undefined {
  return mockDataStore.getState().metrics[toolId];
}
