import React from 'react';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES } from '@/config/role-themes';
import { getRoleDashboardConfig } from '@/config/role-dashboard-config';
import { SparkLine } from '@/components/visualizations/SparkLine';
import { Badge } from '@/components/ui/badge';

/* ── Mock metric data generator ── */
function mockMetricData(format: string): {
  value: number;
  unit: string;
  trend: number[];
  status: 'healthy' | 'warning' | 'critical';
} {
  const rand = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
  const trend = Array.from({ length: 8 }, () => rand(20, 95));

  switch (format) {
    case 'percentage':
      return { value: rand(45, 98), unit: '%', trend, status: trend[trend.length - 1] > 70 ? 'healthy' : trend[trend.length - 1] > 50 ? 'warning' : 'critical' };
    case 'number':
      return { value: rand(0, 120), unit: '', trend, status: trend[trend.length - 1] < 30 ? 'healthy' : trend[trend.length - 1] < 60 ? 'warning' : 'critical' };
    case 'trend':
    default:
      return { value: rand(10, 90), unit: '', trend, status: trend[trend.length - 1] > 60 ? 'healthy' : trend[trend.length - 1] > 40 ? 'warning' : 'critical' };
  }
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  healthy: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e' },
  warning: { bg: 'rgba(234,179,8,0.12)', text: '#eab308' },
  critical: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444' },
};

const STATUS_LABELS: Record<string, string> = {
  healthy: '健康',
  warning: '警告',
  critical: '严重',
};

const TREND_ARROW: Record<string, string> = { up: '↑', down: '↓', flat: '→' };

export const RoleMetricsSection: React.FC = () => {
  const currentRole = useRoleContextStore((s) => s.currentRole);
  if (!currentRole) return null;

  const theme = ROLE_THEMES[currentRole];
  const dashboard = getRoleDashboardConfig(currentRole);

  const allKpis = [...dashboard.primaryKpis, ...dashboard.secondaryKpis];

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3" style={{ color: theme.colors.textSecondary }}>
        专业指标
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {allKpis.map((kpi) => {
          const data = mockMetricData(kpi.format);
          const prev = data.trend[data.trend.length - 2];
          const curr = data.trend[data.trend.length - 1];
          const arrow = curr > prev ? 'up' : curr < prev ? 'down' : 'flat';
          const statusCfg = STATUS_COLORS[data.status];

          return (
            <div
              key={kpi.id}
              className="rounded-lg p-4 cursor-pointer transition-all duration-200 hover:brightness-125 hover:ring-1 hover:ring-white/10"
              style={{ backgroundColor: '#0f1525' }}
            >
              <div className="text-[11px] font-medium mb-1" style={{ color: theme.colors.textSecondary }}>
                {kpi.label}
              </div>
              <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                    {data.value}
                  </span>
                  {data.unit && (
                    <span className="text-xs" style={{ color: theme.colors.textSecondary }}>
                      {data.unit}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: arrow === 'up' ? '#22c55e' : arrow === 'down' ? '#ef4444' : '#94a3b8' }}>
                    {TREND_ARROW[arrow]}
                  </span>
                </div>
                <SparkLine data={data.trend} color={theme.colors.secondary} width={64} height={24} />
              </div>
              <div className="mt-2">
                <Badge
                  className="text-[9px] px-1.5 py-0 border-0"
                  style={{ backgroundColor: statusCfg.bg, color: statusCfg.text }}
                >
                  {STATUS_LABELS[data.status]}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoleMetricsSection;
