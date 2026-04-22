import { useState } from 'react';
import {
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Key,
  UserCheck,
  UserX,
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
  Activity,
  Lock,
  UserPlus,
  Settings,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  AlertCircle,
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
  mockIAMEvents,
  type IAMEvent,
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

export default function IAMAnalytics() {
  const [events] = useState<IAMEvent[]>(mockIAMEvents);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [timeRange, setTimeRange] = useState('7d');

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'all' || event.risk === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const stats = {
    totalUsers: 1247,
    activeUsers: 1189,
    privilegedAccounts: 89,
    serviceAccounts: 234,
    failedLogins: events.filter((e) => e.status === 'failed').length,
    highRiskEvents: events.filter((e) => e.risk === 'high').length,
  };

  const userActivityTrend = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Successful Logins',
        data: [892, 956, 1023, 978, 945, 234, 189],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Failed Logins',
        data: [12, 18, 25, 15, 22, 8, 5],
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const accountTypeDistribution = {
    labels: ['Regular Users', 'Privileged Users', 'Service Accounts', 'Admin Accounts'],
    datasets: [
      {
        data: [924, 89, 234, 12],
        backgroundColor: ['#3B82F6', '#F97316', '#8B5CF6', '#DC2626'],
        borderWidth: 0,
      },
    ],
  };

  const riskEventDistribution = {
    labels: ['Low Risk', 'Medium Risk', 'High Risk'],
    datasets: [
      {
        data: [
          events.filter((e) => e.risk === 'low').length,
          events.filter((e) => e.risk === 'medium').length,
          events.filter((e) => e.risk === 'high').length,
        ],
        backgroundColor: ['#10B981', '#EAB308', '#DC2626'],
        borderWidth: 0,
      },
    ],
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'var(--color-critical)';
      case 'medium': return 'var(--color-medium)';
      case 'low': return 'var(--color-low)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'success' ? CheckCircle : XCircle;
  };

  const getStatusColor = (status: string) => {
    return status === 'success' ? 'var(--color-low)' : 'var(--color-critical)';
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <Users className="w-8 h-8 text-[var(--color-accent-blue)]" />
            IAM Analytics
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Identity and access management monitoring and analytics
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
            Settings
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-info-bg)] rounded-lg">
              <Users size={20} className="text-[var(--color-accent-blue)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Total Users</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-low-bg)] rounded-lg">
              <UserCheck size={20} className="text-[var(--color-low)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-low)]">{stats.activeUsers}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Active</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-high-bg)] rounded-lg">
              <Shield size={20} className="text-[var(--color-high)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-high)]">{stats.privilegedAccounts}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Privileged</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-accent-secondary)]/20 rounded-lg">
              <Key size={20} className="text-[var(--color-accent-secondary)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.serviceAccounts}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Service</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-critical-bg)] rounded-lg">
              <XCircle size={20} className="text-[var(--color-critical)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-critical)]">{stats.failedLogins}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Failed</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-medium-bg)] rounded-lg">
              <AlertTriangle size={20} className="text-[var(--color-medium)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-medium)]">{stats.highRiskEvents}</p>
              <p className="text-xs text-[var(--color-text-muted)]">High Risk</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Activity Trend */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Login Activity Trend</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Successful vs failed logins</p>
            </div>
          </div>
          <div className="h-64">
            <Line
              data={userActivityTrend}
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

        {/* Account Distribution */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Account Types</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Distribution by type</p>
          </div>
          <div className="h-48">
            <Doughnut
              data={accountTypeDistribution}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: { legend: { display: false } },
              }}
            />
          </div>
          <div className="mt-4 space-y-2">
            {accountTypeDistribution.labels.map((label, i) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: accountTypeDistribution.datasets[0].backgroundColor[i] }}
                  />
                  <span>{label}</span>
                </div>
                <span className="font-medium">
                  {accountTypeDistribution.datasets[0].data[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Event Distribution */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Risk Event Distribution</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Events by risk level</p>
          </div>
          <div className="h-48">
            <Doughnut
              data={riskEventDistribution}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: { legend: { display: false } },
              }}
            />
          </div>
          <div className="mt-4 space-y-2">
            {riskEventDistribution.labels.map((label, i) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: riskEventDistribution.datasets[0].backgroundColor[i] }}
                  />
                  <span>{label}</span>
                </div>
                <span className="font-medium">
                  {riskEventDistribution.datasets[0].data[i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* High Risk Alerts */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">High Risk Alerts</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Requires immediate attention</p>
          </div>
          <div className="space-y-3">
            {events.filter((e) => e.risk === 'high').map((event) => {
              const StatusIcon = getStatusIcon(event.status);
              return (
                <div
                  key={event.id}
                  className="p-4 bg-[var(--color-critical-bg)] rounded-lg border border-[var(--color-critical)]/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-[var(--color-critical)]" />
                        <span className="font-medium">{event.action}</span>
                        <span
                          className="flex items-center gap-1"
                          style={{ color: getStatusColor(event.status) }}
                        >
                          <StatusIcon size={14} />
                          {event.status}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        {event.user}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {event.resource} • {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <button className="btn btn-ghost btn-sm">
                      Investigate
                    </button>
                  </div>
                </div>
              );
            })}
            {events.filter((e) => e.risk === 'high').length === 0 && (
              <div className="text-center py-8 text-[var(--color-text-muted)]">
                No high-risk events
              </div>
            )}
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
              placeholder="Search by user or action..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="select"
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* IAM Events Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)]">
          <h2 className="font-semibold">Recent IAM Events ({filteredEvents.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="security-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Risk</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => {
                const StatusIcon = getStatusIcon(event.status);
                return (
                  <tr key={event.id} className="hover:bg-[var(--color-bg-elevated)]/50">
                    <td className="font-medium">{event.user}</td>
                    <td>{event.action}</td>
                    <td>{event.resource}</td>
                    <td>
                      <span
                        className="badge text-xs"
                        style={{
                          backgroundColor: `${getRiskColor(event.risk)}20`,
                          color: getRiskColor(event.risk),
                        }}
                      >
                        {event.risk}
                      </span>
                    </td>
                    <td>
                      <span
                        className="flex items-center gap-1"
                        style={{ color: getStatusColor(event.status) }}
                      >
                        <StatusIcon size={16} />
                        <span className="capitalize">{event.status}</span>
                      </span>
                    </td>
                    <td className="text-sm text-[var(--color-text-muted)]">
                      {new Date(event.timestamp).toLocaleString()}
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
