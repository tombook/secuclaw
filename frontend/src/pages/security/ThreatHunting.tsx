import { useState } from 'react';
import {
  Search,
  Target,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Filter,
  Download,
  Plus,
  ChevronRight,
  ChevronDown,
  Activity,
  Crosshair,
  Shield,
  Database,
  FileSearch,
  Bug,
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
  mockThreatHunts,
  mockAlerts,
  type ThreatHunt,
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

export default function ThreatHunting() {
  const [hunts, setHunts] = useState<ThreatHunt[]>(mockThreatHunts);
  const [alerts] = useState<Alert[]>(mockAlerts);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedHunt, setExpandedHunt] = useState<string | null>(null);
  const [hypothesisText, setHypothesisText] = useState('');
  const [showNewHuntModal, setShowNewHuntModal] = useState(false);

  const filteredHunts = hunts.filter((hunt) => {
    const matchesSearch =
      hunt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hunt.hypothesis.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || hunt.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const huntStats = {
    active: hunts.filter((h) => h.status === 'in_progress').length,
    completed: hunts.filter((h) => h.status === 'completed').length,
    planned: hunts.filter((h) => h.status === 'planned').length,
    totalFindings: hunts.reduce((sum, h) => sum + h.findings, 0),
    totalIOCs: hunts.reduce((sum, h) => sum + h.iocCount, 0),
  };

  const huntActivityData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Hunts Completed',
        data: [3, 5, 4, 7],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'IOCs Discovered',
        data: [15, 28, 22, 45],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const iocTypeDistribution = {
    labels: ['IP Addresses', 'Domains', 'File Hashes', 'URLs', 'Emails'],
    datasets: [
      {
        data: [35, 25, 20, 12, 8],
        backgroundColor: [
          '#DC2626',
          '#F97316',
          '#EAB308',
          '#10B981',
          '#3B82F6',
        ],
        borderWidth: 0,
      },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'var(--color-accent-blue)';
      case 'completed':
        return 'var(--color-low)';
      case 'planned':
        return 'var(--color-text-muted)';
      default:
        return 'var(--color-text-muted)';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'var(--color-info-bg)';
      case 'completed':
        return 'var(--color-low-bg)';
      case 'planned':
        return 'var(--color-bg-elevated)';
      default:
        return 'var(--color-bg-elevated)';
    }
  };

  const handleStartHunt = (huntId: string) => {
    setHunts((prev) =>
      prev.map((h) => (h.id === huntId ? { ...h, status: 'in_progress' } : h))
    );
  };

  const handleCompleteHunt = (huntId: string) => {
    setHunts((prev) =>
      prev.map((h) => (h.id === huntId ? { ...h, status: 'completed' } : h))
    );
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <Crosshair className="w-8 h-8 text-[var(--color-accent-blue)]" />
            Threat Hunting Workspace
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Proactive threat detection through hypothesis-driven investigations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <Download size={16} />
            Export Report
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowNewHuntModal(true)}
          >
            <Plus size={16} />
            New Hunt
          </button>
        </div>
      </div>

      {/* Hunt Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Activity}
          label="Active Hunts"
          value={huntStats.active.toString()}
          color="var(--color-accent-blue)"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={huntStats.completed.toString()}
          color="var(--color-low)"
        />
        <StatCard
          icon={Clock}
          label="Planned"
          value={huntStats.planned.toString()}
          color="var(--color-text-muted)"
        />
        <StatCard
          icon={Bug}
          label="Total Findings"
          value={huntStats.totalFindings.toString()}
          color="var(--color-high)"
        />
        <StatCard
          icon={Database}
          label="Total IOCs"
          value={huntStats.totalIOCs.toString()}
          color="var(--color-critical)"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hunt Activity Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Hunt Activity Trend</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Weekly hunting metrics
              </p>
            </div>
          </div>
          <div className="h-64">
            <Line
              data={huntActivityData}
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

        {/* IOC Distribution */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">IOC Type Distribution</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Indicators collected
            </p>
          </div>
          <div className="h-48">
            <Doughnut
              data={iocTypeDistribution}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: { legend: { display: false } },
              }}
            />
          </div>
          <div className="mt-4 space-y-2">
            {iocTypeDistribution.labels.map((label, i) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        iocTypeDistribution.datasets[0].backgroundColor[i],
                    }}
                  ></span>
                  <span className="text-[var(--color-text-secondary)]">
                    {label}
                  </span>
                </div>
                <span className="font-medium">
                  {iocTypeDistribution.datasets[0].data[i]}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hypothesis Builder */}
      <div className="card p-6 bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-surface)]">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[var(--color-info-bg)] rounded-lg">
            <Target size={24} className="text-[var(--color-accent-blue)]" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Hypothesis Builder</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Frame your hunt with a testable hypothesis
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Given that... we expect to find... because..."
                className="input flex-1"
                value={hypothesisText}
                onChange={(e) => setHypothesisText(e.target.value)}
              />
              <button className="btn btn-primary">
                <Search size={16} />
                Start Hunting
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hunt Queue */}
      <div className="card">
        <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)]">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <h2 className="font-semibold text-lg">Hunt Queue</h2>
            <div className="flex-1 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                />
                <input
                  type="search"
                  placeholder="Search hunts..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="planned">Planned</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-[var(--color-border-primary)]">
          {filteredHunts.map((hunt) => {
            const isExpanded = expandedHunt === hunt.id;
            return (
              <div
                key={hunt.id}
                className="hover:bg-[var(--color-bg-elevated)]/50 transition-colors"
              >
                <button
                  className="w-full p-4 flex items-center gap-4 text-left"
                  onClick={() => setExpandedHunt(isExpanded ? null : hunt.id)}
                >
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: getStatusBg(hunt.status) }}
                  >
                    {hunt.status === 'in_progress' ? (
                      <Activity
                        size={20}
                        style={{ color: getStatusColor(hunt.status) }}
                        className="animate-pulse"
                      />
                    ) : hunt.status === 'completed' ? (
                      <CheckCircle
                        size={20}
                        style={{ color: getStatusColor(hunt.status) }}
                      />
                    ) : (
                      <Clock
                        size={20}
                        style={{ color: getStatusColor(hunt.status) }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{hunt.name}</span>
                      <span
                        className="badge text-xs"
                        style={{
                          backgroundColor: getStatusBg(hunt.status),
                          color: getStatusColor(hunt.status),
                        }}
                      >
                        {hunt.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1 truncate">
                      {hunt.hypothesis}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1">
                        <Bug size={12} />
                        {hunt.findings} findings
                      </span>
                      <span className="flex items-center gap-1">
                        <Database size={12} />
                        {hunt.iocCount} IOCs
                      </span>
                      <span>
                        by {hunt.createdBy}
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 animate-fade-in">
                    <div className="p-4 bg-[var(--color-bg-elevated)] rounded-lg space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Created
                          </p>
                          <p className="font-medium text-sm">
                            {new Date(hunt.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Created By
                          </p>
                          <p className="font-medium text-sm">{hunt.createdBy}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Findings
                          </p>
                          <p className="font-medium text-sm">{hunt.findings}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            IOCs
                          </p>
                          <p className="font-medium text-sm">{hunt.iocCount}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        {hunt.status === 'planned' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleStartHunt(hunt.id)}
                          >
                            <Play size={14} />
                            Start Hunt
                          </button>
                        )}
                        {hunt.status === 'in_progress' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleCompleteHunt(hunt.id)}
                          >
                            <CheckCircle size={14} />
                            Complete Hunt
                          </button>
                        )}
                        <button className="btn btn-ghost btn-sm">
                          <FileSearch size={14} />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Related Alerts */}
      <div className="card">
        <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)]">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[var(--color-high)]" />
            Potential Hunt Triggers
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Alerts that may indicate hunt opportunities
          </p>
        </div>
        <div className="divide-y divide-[var(--color-border-primary)]">
          {alerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className="p-4 hover:bg-[var(--color-bg-elevated)]/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`badge badge-${alert.severity}`}
                    >
                      {alert.severity}
                    </span>
                    <span className="font-medium">{alert.title}</span>
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">
                    {alert.description}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {alert.source} •{' '}
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
                <button className="btn btn-ghost btn-sm">
                  <Crosshair size={14} />
                  Hunt
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div
          className="p-2.5 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
        </div>
      </div>
    </div>
  );
}
