import { useState } from 'react';
import {
  Network,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Download,
  Activity,
  Server,
  Wifi,
  Globe,
  Lock,
  Eye,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ChevronDown,
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
  mockNetworkEvents,
  mockAlerts,
  type NetworkEvent,
  type Alert,
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

export default function NetworkSecurityMonitoring() {
  const [events] = useState<NetworkEvent[]>(mockNetworkEvents);
  const [alerts] = useState<Alert[]>(mockAlerts);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [timeRange, setTimeRange] = useState('1h');

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.sourceIp.includes(searchTerm) ||
      event.destIp.includes(searchTerm) ||
      event.protocol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'all' || event.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const stats = {
    totalEvents: events.length,
    allowed: events.filter((e) => e.action === 'allowed').length,
    blocked: events.filter((e) => e.action === 'blocked').length,
    alerts: events.filter((e) => e.action === 'alert').length,
    totalBytes: events.reduce((sum, e) => sum + e.bytes, 0),
  };

  const trafficTrendData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'Allowed',
        data: [1200, 800, 2500, 3200, 2800, 1800, 1000],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Blocked',
        data: [50, 30, 120, 180, 150, 80, 40],
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const protocolDistribution = {
    labels: ['HTTPS', 'DNS', 'SSH', 'SMTP', 'Database', 'Other'],
    datasets: [
      {
        data: [45, 25, 12, 8, 6, 4],
        backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#EAB308', '#6B7280'],
        borderWidth: 0,
      },
    ],
  };

  const threatActivity = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Intrusion Attempts',
        data: [45, 62, 38, 55, 78, 23, 15],
        backgroundColor: 'rgba(220, 38, 38, 0.7)',
        borderRadius: 4,
      },
      {
        label: 'Port Scans',
        data: [23, 35, 28, 42, 55, 12, 8],
        backgroundColor: 'rgba(249, 115, 22, 0.7)',
        borderRadius: 4,
      },
    ],
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'allowed': return CheckCircle;
      case 'blocked': return XCircle;
      case 'alert': return AlertTriangle;
      default: return Activity;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'allowed': return 'var(--color-low)';
      case 'blocked': return 'var(--color-critical)';
      case 'alert': return 'var(--color-high)';
      default: return 'var(--color-text-muted)';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <Network className="w-8 h-8 text-[var(--color-accent-blue)]" />
            Network Security Monitoring
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Real-time network traffic analysis and threat detection
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="select text-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
          <button className="btn btn-secondary">
            <Download size={16} />
            Export
          </button>
          <button className="btn btn-primary">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Live Traffic Indicator */}
      <div className="card p-4 bg-gradient-to-r from-[var(--color-bg-elevated)] to-[var(--color-bg-surface)] border border-[var(--color-low)]/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 bg-[var(--color-low)] rounded-full animate-pulse" />
              <div className="absolute inset-0 w-3 h-3 bg-[var(--color-low)] rounded-full animate-ping" />
            </div>
            <span className="font-medium">Live Traffic</span>
            <span className="text-sm text-[var(--color-text-muted)]">
              Monitoring {stats.totalEvents} events
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-low)]" />
              <span className="text-sm">Allowed: {stats.allowed}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-critical)]" />
              <span className="text-sm">Blocked: {stats.blocked}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-high)]" />
              <span className="text-sm">Alerts: {stats.alerts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-info-bg)] rounded-lg">
              <Activity size={20} className="text-[var(--color-accent-blue)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalEvents}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Total Events</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-low-bg)] rounded-lg">
              <Shield size={20} className="text-[var(--color-low)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-low)]">{stats.allowed}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Allowed</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-critical-bg)] rounded-lg">
              <XCircle size={20} className="text-[var(--color-critical)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-critical)]">{stats.blocked}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Blocked</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-high-bg)] rounded-lg">
              <AlertTriangle size={20} className="text-[var(--color-high)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-high)]">{stats.alerts}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Alerts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Trend */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Traffic Trend</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Allowed vs Blocked requests</p>
            </div>
          </div>
          <div className="h-64">
            <Line
              data={trafficTrendData}
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

        {/* Protocol Distribution */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Protocol Distribution</h2>
            <p className="text-sm text-[var(--color-text-muted)]">By traffic volume</p>
          </div>
          <div className="h-48">
            <Doughnut
              data={protocolDistribution}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: { legend: { display: false } },
              }}
            />
          </div>
          <div className="mt-4 space-y-2">
            {protocolDistribution.labels.map((label, i) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: protocolDistribution.datasets[0].backgroundColor[i] }}
                  />
                  <span>{label}</span>
                </div>
                <span className="font-medium">
                  {protocolDistribution.datasets[0].data[i]}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Threat Activity */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Threat Activity</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Intrusion attempts and port scans</p>
          </div>
        </div>
        <div className="h-64">
          <Bar
            data={threatActivity}
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
              placeholder="Search by IP or protocol..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="select"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="all">All Actions</option>
            <option value="allowed">Allowed</option>
            <option value="blocked">Blocked</option>
            <option value="alert">Alert</option>
          </select>
        </div>
      </div>

      {/* Network Events Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)]">
          <h2 className="font-semibold">Network Events ({filteredEvents.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="security-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Source IP</th>
                <th>Destination</th>
                <th>Protocol</th>
                <th>Action</th>
                <th>Bytes</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => {
                const ActionIcon = getActionIcon(event.action);
                return (
                  <tr key={event.id} className="hover:bg-[var(--color-bg-elevated)]/50">
                    <td className="text-sm text-[var(--color-text-muted)]">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="font-mono text-sm">{event.sourceIp}</td>
                    <td className="font-mono text-sm">{event.destIp}</td>
                    <td>
                      <span className="badge badge-info">{event.protocol}</span>
                    </td>
                    <td>
                      <span
                        className="flex items-center gap-1"
                        style={{ color: getActionColor(event.action) }}
                      >
                        <ActionIcon size={16} />
                        <span className="capitalize">{event.action}</span>
                      </span>
                    </td>
                    <td className="text-sm">{formatBytes(event.bytes)}</td>
                    <td>
                      <span className="badge">{event.category}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Alerts */}
      <div className="card">
        <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)]">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[var(--color-high)]" />
            Recent Alerts
          </h2>
        </div>
        <div className="divide-y divide-[var(--color-border-primary)]">
          {alerts.slice(0, 4).map((alert) => (
            <div key={alert.id} className="p-4 hover:bg-[var(--color-bg-elevated)]/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-${alert.severity}`}>
                      {alert.severity}
                    </span>
                    <span className="font-medium">{alert.title}</span>
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">
                    {alert.description}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {alert.source} • {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
                <button className="btn btn-ghost btn-sm">
                  Investigate
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
