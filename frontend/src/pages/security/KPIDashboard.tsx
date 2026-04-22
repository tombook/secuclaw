import { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  RefreshCw,
  Download,
  Filter,
  Play,
  Pause,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Eye,
  Users,
  Server,
  Lock,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  mockKPIMetrics,
  mockSecurityMetrics,
  type KPIMetric,
} from '../../api/securityData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function KPIDashboard() {
  const [metrics, setMetrics] = useState<KPIMetric[]>(mockKPIMetrics);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--color-accent-blue)]" />
      </div>
    );
  }

  const kpiTrendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'MTTD (min)',
        data: [18, 15, 14, 12],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'MTTR (min)',
        data: [58, 52, 48, 45],
        borderColor: '#F97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const alertVolumeData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Alerts',
        data: [1250, 1380, 1290, 1420, 1150, 780, 620],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderRadius: 4,
      },
    ],
  };

  const alertResolutionData = {
    labels: ['Resolved', 'In Progress', 'Escalated', 'False Positive'],
    datasets: [
      {
        data: [65, 20, 10, 5],
        backgroundColor: ['#10B981', '#3B82F6', '#F97316', '#6B7280'],
        borderWidth: 0,
      },
    ],
  };

  const coverageData = {
    labels: ['Network', 'Endpoint', 'Cloud', 'Identity', 'Application'],
    datasets: [
      {
        label: 'Coverage %',
        data: [95, 92, 88, 85, 78],
        backgroundColor: [
          '#10B981',
          '#3B82F6',
          '#8B5CF6',
          '#F97316',
          '#EAB308',
        ],
        borderRadius: 4,
      },
    ],
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) {
      return <TrendingUp size={14} className="text-[var(--color-low)]" />;
    }
    return <TrendingDown size={14} className="text-[var(--color-critical)]" />;
  };

  const getTrendColor = (metricName: string, trend: number) => {
    // For metrics like MTTD, MTTR, False Positive Rate - lower is better
    const lowerIsBetter = metricName.toLowerCase().includes('time') ||
                          metricName.toLowerCase().includes('rate');
    return lowerIsBetter
      ? trend < 0
        ? 'text-[var(--color-low)]'
        : 'text-[var(--color-critical)]'
      : trend > 0
      ? 'text-[var(--color-low)]'
      : 'text-[var(--color-critical)]';
  };

  const getPerformanceStatus = (value: number, target: number) => {
    const ratio = value / target;
    if (ratio <= 0.8) return { status: 'excellent', color: 'var(--color-low)', bg: 'var(--color-low-bg)' };
    if (ratio <= 1.0) return { status: 'good', color: 'var(--color-accent-blue)', bg: 'var(--color-info-bg)' };
    if (ratio <= 1.2) return { status: 'warning', color: 'var(--color-medium)', bg: 'var(--color-medium-bg)' };
    return { status: 'critical', color: 'var(--color-critical)', bg: 'var(--color-critical-bg)' };
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[var(--color-accent-blue)]" />
            Security KPI Dashboard
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Monitor security operations performance metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="select text-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="btn btn-secondary">
            <Download size={16} />
            Export
          </button>
          <button className="btn btn-primary">
            <Settings size={16} />
            Configure
          </button>
        </div>
      </div>

      {/* KPI Score Overview */}
      <div className="card p-6 bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-surface)] border border-[var(--color-accent-blue)]/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-6">
            <KPIGauge score={mockSecurityMetrics.overallScore} size={140} />
            <div>
              <h2 className="text-2xl font-bold">Security Performance Index</h2>
              <p className="text-[var(--color-text-muted)] mt-1">
                Composite score based on all KPIs
              </p>
              <div className="flex items-center gap-4 mt-3">
                <span className={`badge ${
                  mockSecurityMetrics.riskLevel === 'low' ? 'badge-low' :
                  mockSecurityMetrics.riskLevel === 'medium' ? 'badge-medium' : 'badge-high'
                }`}>
                  {mockSecurityMetrics.riskLevel?.toUpperCase()} RISK
                </span>
                <span className="flex items-center gap-1 text-sm">
                  {getTrendIcon(mockSecurityMetrics.trend)}
                  <span className={getTrendColor('Trend', mockSecurityMetrics.trend)}>
                    {mockSecurityMetrics.trend}% vs last period
                  </span>
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickStat icon={CheckCircle} label="Resolved Today" value="47" trend="+12%" />
            <QuickStat icon={Clock} label="Avg Response" value="8m" trend="-23%" />
            <QuickStat icon={AlertTriangle} label="Open Alerts" value="23" trend="-5%" />
            <QuickStat icon={Target} label="On Target" value="5/6" trend="83%" />
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const perf = getPerformanceStatus(metric.value, metric.target);
          return (
            <div key={metric.id} className="card p-5 border-l-4" style={{ borderLeftColor: perf.color }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-[var(--color-text-muted)]">{metric.name}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-bold" style={{ color: perf.color }}>
                      {metric.value}
                    </span>
                    <span className="text-sm text-[var(--color-text-muted)]">
                      {metric.unit}
                    </span>
                  </div>
                </div>
                <div className={`p-2.5 rounded-lg`} style={{ backgroundColor: perf.bg }}>
                  <Activity size={20} style={{ color: perf.color }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-muted)]">Target</span>
                  <span className="font-medium">{metric.target} {metric.unit}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min((metric.value / metric.target) * 50, 100)}%`,
                      backgroundColor: perf.color,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`flex items-center gap-1 ${getTrendColor(metric.name, metric.trend)}`}>
                    {getTrendIcon(metric.trend)}
                    {Math.abs(metric.trend)}%
                  </span>
                  <span className="text-[var(--color-text-muted)]">{perf.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detection & Response Trend */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Detection & Response Trend</h2>
              <p className="text-sm text-[var(--color-text-muted)]">MTTD and MTTR over time</p>
            </div>
          </div>
          <div className="h-64">
            <Line
              data={kpiTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#9CA3AF' },
                  },
                },
                scales: {
                  y: {
                    grid: { color: 'rgba(107, 114, 128, 0.1)' },
                    ticks: { color: '#9CA3AF' },
                  },
                  x: {
                    grid: { display: false },
                    ticks: { color: '#9CA3AF' },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Alert Volume */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Alert Volume</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Daily alert distribution</p>
            </div>
          </div>
          <div className="h-64">
            <Bar
              data={alertVolumeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    grid: { color: 'rgba(107, 114, 128, 0.1)' },
                    ticks: { color: '#9CA3AF' },
                  },
                  x: {
                    grid: { display: false },
                    ticks: { color: '#9CA3AF' },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Coverage & Resolution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detection Coverage */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Detection Coverage</h2>
            <p className="text-sm text-[var(--color-text-muted)]">By security domain</p>
          </div>
          <div className="h-48">
            <Bar
              data={coverageData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    grid: { color: 'rgba(107, 114, 128, 0.1)' },
                    ticks: { color: '#9CA3AF' },
                    max: 100,
                  },
                  y: {
                    grid: { display: false },
                    ticks: { color: '#9CA3AF' },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Alert Resolution */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Alert Resolution</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Current period breakdown</p>
          </div>
          <div className="h-48">
            <Doughnut
              data={alertResolutionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: { legend: { display: false } },
              }}
            />
          </div>
          <div className="mt-4 space-y-2">
            {alertResolutionData.labels.map((label, i) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: alertResolutionData.datasets[0].backgroundColor[i] }}
                  />
                  <span>{label}</span>
                </div>
                <span className="font-medium">{alertResolutionData.datasets[0].data[i]}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* SLA Compliance */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">SLA Compliance</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Response time adherence</p>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Critical Alerts', sla: '15m', compliance: 94 },
              { name: 'High Alerts', sla: '1h', compliance: 87 },
              { name: 'Medium Alerts', sla: '4h', compliance: 92 },
              { name: 'Low Alerts', sla: '24h', compliance: 98 },
            ].map((sla) => (
              <div key={sla.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{sla.name}</span>
                  <span className="font-medium">{sla.compliance}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${sla.compliance}%`,
                      backgroundColor: sla.compliance >= 90 ? 'var(--color-low)' : sla.compliance >= 80 ? 'var(--color-medium)' : 'var(--color-critical)',
                    }}
                  />
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">Target: {sla.sla}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPIGauge({ score, size = 120 }: { score: number; size?: number }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#EAB308' : '#DC2626';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={45}
          stroke="var(--color-bg-elevated)"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={45}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-[var(--color-text-muted)]">/ 100</span>
      </div>
    </div>
  );
}

function QuickStat({ icon: Icon, label, value, trend }: { icon: React.ElementType; label: string; value: string; trend: string }) {
  return (
    <div className="text-center p-4 bg-[var(--color-bg-elevated)]/50 rounded-lg">
      <Icon size={24} className="mx-auto text-[var(--color-accent-blue)] mb-2" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <span className="text-xs text-[var(--color-low)]">{trend}</span>
    </div>
  );
}
