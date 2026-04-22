import { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Activity,
  Mail,
  Cloud,
  Monitor,
  Globe,
  Lock,
  Eye,
  Settings,
  FileText,
  Clock,
  TrendingUp,
  TrendingDown,
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
  mockDLPPolicies,
  type DLPPolicy,
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

export default function DLPPanel() {
  const [policies] = useState<DLPPolicy[]>(mockDLPPolicies);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [timeRange, setTimeRange] = useState('7d');

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch = policy.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || policy.type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    totalViolations: policies.reduce((sum, p) => sum + p.violations, 0),
    activePolicies: policies.filter((p) => p.status === 'active').length,
    emailViolations: policies.filter((p) => p.type === 'email')[0]?.violations || 0,
    endpointViolations: policies.filter((p) => p.type === 'endpoint')[0]?.violations || 0,
    cloudViolations: policies.filter((p) => p.type === 'cloud')[0]?.violations || 0,
    webViolations: policies.filter((p) => p.type === 'web')[0]?.violations || 0,
  };

  const violationTrend = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Email',
        data: [15, 18, 12, 22, 19, 8, 5],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Endpoint',
        data: [5, 8, 6, 12, 9, 3, 2],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Cloud',
        data: [22, 28, 25, 35, 30, 12, 8],
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const violationByType = {
    labels: ['Email', 'Endpoint', 'Cloud', 'Web'],
    datasets: [
      {
        data: [stats.emailViolations, stats.endpointViolations, stats.cloudViolations, stats.webViolations],
        backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F97316'],
        borderWidth: 0,
      },
    ],
  };

  const topViolations = [
    { type: 'Credit Card Numbers', count: 28, trend: '+12%' },
    { type: 'SSN/Social Security', count: 22, trend: '+5%' },
    { type: 'Health Records (PHI)', count: 15, trend: '-8%' },
    { type: 'Passwords/Credentials', count: 12, trend: '+23%' },
    { type: 'Financial Data', count: 8, trend: '-3%' },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'web': return Globe;
      case 'endpoint': return Monitor;
      case 'cloud': return Cloud;
      default: return Shield;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return '#3B82F6';
      case 'web': return '#F97316';
      case 'endpoint': return '#10B981';
      case 'cloud': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <Lock className="w-8 h-8 text-[var(--color-accent-blue)]" />
            Data Loss Prevention
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Monitor and prevent sensitive data exfiltration
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="select text-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4 border-l-4 border-l-[var(--color-critical)]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-critical-bg)] rounded-lg">
              <AlertTriangle size={20} className="text-[var(--color-critical)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-critical)]">{stats.totalViolations}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Total Violations</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-low-bg)] rounded-lg">
              <CheckCircle size={20} className="text-[var(--color-low)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-low)]">{stats.activePolicies}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Active Policies</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-info-bg)] rounded-lg">
              <Mail size={20} className="text-[var(--color-accent-blue)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.emailViolations}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Email</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-low-bg)] rounded-lg">
              <Monitor size={20} className="text-[var(--color-low)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.endpointViolations}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Endpoint</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-accent-secondary)]/20 rounded-lg">
              <Cloud size={20} className="text-[var(--color-accent-secondary)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.cloudViolations}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Cloud</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Violation Trend */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">DLP Violation Trend</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Violations over time by channel</p>
            </div>
          </div>
          <div className="h-64">
            <Line
              data={violationTrend}
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

        {/* Violation by Type */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Violations by Channel</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Distribution by type</p>
          </div>
          <div className="h-48">
            <Doughnut
              data={violationByType}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: { legend: { display: false } },
              }}
            />
          </div>
          <div className="mt-4 space-y-2">
            {violationByType.labels.map((label, i) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: violationByType.datasets[0].backgroundColor[i] }}
                  />
                  <span>{label}</span>
                </div>
                <span className="font-medium">
                  {violationByType.datasets[0].data[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Violations & Policies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Violations */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Top Data Types Detected</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Most common sensitive data violations</p>
          </div>
          <div className="space-y-4">
            {topViolations.map((item, index) => (
              <div key={item.type} className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.type}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{item.count} violations</p>
                </div>
                <span className={`flex items-center gap-1 text-xs ${item.trend.startsWith('+') ? 'text-[var(--color-critical)]' : 'text-[var(--color-low)]'}`}>
                  {item.trend.startsWith('+') ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {item.trend}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* DLP Policies */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Active DLP Policies</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Policy enforcement status</p>
          </div>
          <div className="space-y-4">
            {policies.map((policy) => {
              const TypeIcon = getTypeIcon(policy.type);
              const typeColor = getTypeColor(policy.type);
              return (
                <div key={policy.id} className="p-4 bg-[var(--color-bg-elevated)] rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${typeColor}20` }}
                      >
                        <TypeIcon size={18} style={{ color: typeColor }} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{policy.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)] capitalize">{policy.type}</p>
                      </div>
                    </div>
                    <span
                      className={`badge text-xs ${policy.status === 'active' ? 'badge-low' : 'badge-medium'}`}
                    >
                      {policy.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {policy.violations} violations this week
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      Last: {new Date(policy.lastTriggered).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              type="search"
              placeholder="Search policies..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Channels</option>
            <option value="email">Email</option>
            <option value="web">Web</option>
            <option value="endpoint">Endpoint</option>
            <option value="cloud">Cloud</option>
          </select>
        </div>
      </div>

      {/* Policies Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)]">
          <h2 className="font-semibold">DLP Policies ({filteredPolicies.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="security-table">
            <thead>
              <tr>
                <th>Policy</th>
                <th>Type</th>
                <th>Violations</th>
                <th>Status</th>
                <th>Last Triggered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.map((policy) => {
                const TypeIcon = getTypeIcon(policy.type);
                return (
                  <tr key={policy.id} className="hover:bg-[var(--color-bg-elevated)]/50">
                    <td>
                      <div className="flex items-center gap-3">
                        <TypeIcon size={18} style={{ color: getTypeColor(policy.type) }} />
                        <span className="font-medium">{policy.name}</span>
                      </div>
                    </td>
                    <td className="capitalize">{policy.type}</td>
                    <td>
                      <span className={policy.violations > 20 ? 'text-[var(--color-critical)] font-medium' : ''}>
                        {policy.violations}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${policy.status === 'active' ? 'badge-low' : 'badge-medium'}`}>
                        {policy.status}
                      </span>
                    </td>
                    <td className="text-sm text-[var(--color-text-muted)]">
                      {new Date(policy.lastTriggered).toLocaleString()}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm">
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-ghost btn-sm">
                          <Settings size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
