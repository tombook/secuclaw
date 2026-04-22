import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  Eye,
  Clock,
  Server,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowRight,
  Target,
  Zap,
  FileText,
  Download,
  Play,
  Wifi,
  Database,
  Cloud,
  Monitor,
  Users,
  Lock,
  FileWarning,
  BarChart3,
  Crosshair,
  Bell,
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
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  mockSecurityMetrics,
  mockVulnerabilities,
  mockIncidents,
  mockAlerts,
  mockKPIMetrics,
  getVulnerabilityBySeverity,
  getSecurityScoreTrend,
  getAlertVolumeTrend,
  getComplianceTrend,
  type SecurityMetrics,
  type Vulnerability,
  type Incident,
  type Alert,
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

export default function SecurityDashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics(mockSecurityMetrics);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-[var(--color-accent-blue)]" />
          <p className="text-[var(--color-text-muted)]">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  const vulnBySeverity = getVulnerabilityBySeverity();
  const scoreTrend = getSecurityScoreTrend();
  const alertTrend = getAlertVolumeTrend();
  const complianceTrend = getComplianceTrend();

  const severityColors = {
    critical: '#DC2626',
    high: '#F97316',
    medium: '#EAB308',
    low: '#10B981',
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <Shield className="w-8 h-8 text-[var(--color-accent-blue)]" />
            Security Operations Center
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Real-time security posture monitoring and threat management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="select text-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            aria-label="Time range selection"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="btn btn-secondary" aria-label="Export report">
            <Download size={16} />
            Export
          </button>
          <button className="btn btn-primary" aria-label="Run scan">
            <Play size={16} />
            Run Scan
          </button>
        </div>
      </div>

      {/* Security Score Hero */}
      <div className="card p-8 bg-gradient-to-br from-[var(--color-bg-tertiary)] to-[var(--color-bg-card)] border border-[var(--color-accent-blue)]/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-6">
            <SecurityScoreGauge score={metrics?.overallScore || 0} size={120} />
            <div>
              <h2 className="text-2xl font-bold">Security Posture Score</h2>
              <p className="text-[var(--color-text-muted)] mt-1">
                Overall security health based on 47 assessment criteria
              </p>
              <div className="flex items-center gap-4 mt-3">
                <span className={`badge ${metrics?.riskLevel === 'low' ? 'badge-low' : metrics?.riskLevel === 'medium' ? 'badge-medium' : 'badge-high'}`}>
                  {metrics?.riskLevel?.toUpperCase()} RISK
                </span>
                <span className="flex items-center gap-1 text-sm">
                  {metrics?.trend && metrics.trend > 0 ? (
                    <TrendingUp size={16} className="text-[var(--color-accent-green)]" />
                  ) : (
                    <TrendingDown size={16} className="text-[var(--color-accent-red)]" />
                  )}
                  <span className={metrics?.trend && metrics.trend > 0 ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}>
                    {metrics?.trend}% from last month
                  </span>
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            <QuickStat icon={AlertTriangle} label="Active Alerts" value="23" trend="+5" />
            <QuickStat icon={XCircle} label="Open Incidents" value="4" trend="-2" />
            <QuickStat icon={CheckCircle} label="Resolved Today" value="12" trend="+8" />
            <QuickStat icon={Eye} label="Scanning" value="3" trend="active" />
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Critical Vulnerabilities"
          value={vulnBySeverity.critical.toString()}
          icon={XCircle}
          severity="critical"
          trend="up"
          trendValue={vulnBySeverity.critical > 5 ? '+3 this week' : '-2 this week'}
          href="/vulnerability-management"
        />
        <MetricCard
          title="Mean Time to Detect"
          value="12m"
          icon={Clock}
          severity="info"
          trend="down"
          trendValue="-8% vs last month"
          href="/kpi-dashboard"
        />
        <MetricCard
          title="Threats Blocked"
          value="1,247"
          icon={Shield}
          severity="success"
          trend="up"
          trendValue="+15% effectiveness"
          href="/threat-intelligence"
        />
        <MetricCard
          title="Compliance Score"
          value="85%"
          icon={CheckCircle}
          severity="info"
          trend="up"
          trendValue="+5% improvement"
          href="/compliance-audit"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Score Trend */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Security Score Trend</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Score progression over time</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-sm btn-primary">6M</button>
              <button className="btn btn-sm btn-ghost">1Y</button>
            </div>
          </div>
          <div className="h-64">
            <Line data={{
              labels: scoreTrend.labels,
              datasets: [{
                label: 'Security Score',
                data: scoreTrend.score,
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
              }],
            }} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { min: 50, max: 100, grid: { color: 'rgba(107, 114, 128, 0.1)' }, ticks: { color: '#9CA3AF' } },
                x: { grid: { color: 'rgba(107, 114, 128, 0.1)' }, ticks: { color: '#9CA3AF' } },
              },
            }} />
          </div>
        </div>

        {/* Vulnerability Distribution */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Vulnerability Severity</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Distribution by severity level</p>
          </div>
          <div className="h-48">
            <Doughnut data={{
              labels: ['Critical', 'High', 'Medium', 'Low'],
              datasets: [{
                data: [vulnBySeverity.critical, vulnBySeverity.high, vulnBySeverity.medium, vulnBySeverity.low],
                backgroundColor: [severityColors.critical, severityColors.high, severityColors.medium, severityColors.low],
                borderWidth: 0,
                hoverOffset: 4,
              }],
            }} options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: '65%',
              plugins: { legend: { display: false } },
            }} />
          </div>
          <div className="mt-4 space-y-3">
            {Object.entries(vulnBySeverity).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: severityColors[severity as keyof typeof severityColors] }}></span>
                  <span className="text-sm capitalize">{severity}</span>
                </div>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Incidents & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Incidents */}
        <div className="card">
          <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[var(--color-accent-orange)]" />
                Active Incidents
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">Incidents requiring attention</p>
            </div>
            <button className="btn btn-sm btn-ghost">
              View All
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {mockIncidents.slice(0, 3).map((incident) => (
              <IncidentRow key={incident.id} incident={incident} />
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="card">
          <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Bell className="w-5 h-5 text-[var(--color-accent-blue)]" />
                Recent Alerts
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">Latest security notifications</p>
            </div>
            <button className="btn btn-sm btn-ghost">
              View All
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {mockAlerts.slice(0, 3).map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function SecurityScoreGauge({ score, size = 120 }: { score: number; size?: number }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#EAB308' : '#DC2626';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={45} stroke="var(--color-bg-tertiary)" strokeWidth="8" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={45}
          stroke={color}
          strokeWidth="8"
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

function MetricCard({
  title,
  value,
  icon: Icon,
  severity,
  trend,
  trendValue,
  href,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  severity: 'critical' | 'warning' | 'success' | 'info';
  trend: 'up' | 'down';
  trendValue: string;
  href: string;
}) {
  const styles = {
    critical: { border: 'border-l-4 border-l-[var(--color-critical)]', icon: 'text-[var(--color-critical)] bg-[var(--color-critical-bg)]' },
    warning: { border: 'border-l-4 border-l-[var(--color-high)]', icon: 'text-[var(--color-high)] bg-[var(--color-high-bg)]' },
    success: { border: 'border-l-4 border-l-[var(--color-low)]', icon: 'text-[var(--color-low)] bg-[var(--color-low-bg)]' },
    info: { border: 'border-l-4 border-l-[var(--color-info)]', icon: 'text-[var(--color-info)] bg-[var(--color-info-bg)]' },
  };

  return (
    <a href={href} className={`card p-5 hover:border-[var(--color-border-light)] transition-all ${styles[severity].border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">{title}</p>
          <p className="text-2xl font-bold mt-1 text-[var(--color-text-primary)]">{value}</p>
          <div className="flex items-center gap-1 mt-2">
            {trend === 'down' ? (
              <TrendingDown size={12} className="text-[var(--color-low)]" />
            ) : (
              <TrendingUp size={12} className="text-[var(--color-high)]" />
            )}
            <span className="text-xs text-[var(--color-text-muted)]">{trendValue}</span>
          </div>
        </div>
        <div className={`p-2.5 rounded-lg ${styles[severity].icon}`}>
          <Icon size={20} />
        </div>
      </div>
    </a>
  );
}

function QuickStat({ icon: Icon, label, value, trend }: { icon: React.ElementType; label: string; value: string; trend: string }) {
  return (
    <div className="text-center p-4 bg-[var(--color-bg-tertiary)]/50 rounded-lg">
      <Icon size={24} className="mx-auto text-[var(--color-accent-blue)] mb-2" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
    </div>
  );
}

function IncidentRow({ incident }: { incident: Incident }) {
  const severityBadge = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
  };

  return (
    <div className="p-4 hover:bg-[var(--color-bg-tertiary)] transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`badge ${severityBadge[incident.severity]}`}>{incident.severity.toUpperCase()}</span>
            <span className="font-medium text-sm">{incident.title}</span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {incident.id} • Assigned to {incident.assignee}
          </p>
        </div>
        <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">
          {new Date(incident.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  const severityBadge = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
  };

  return (
    <div className="p-4 hover:bg-[var(--color-bg-tertiary)] transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`badge ${severityBadge[alert.severity]}`}>{alert.severity.toUpperCase()}</span>
            <span className="text-sm">{alert.title}</span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {alert.source} • {new Date(alert.timestamp).toLocaleString()}
          </p>
        </div>
        <span className={`badge ${alert.status === 'new' ? 'badge-info' : alert.status === 'resolved' ? 'badge-low' : 'badge-medium'}`}>
          {alert.status}
        </span>
      </div>
    </div>
  );
}
