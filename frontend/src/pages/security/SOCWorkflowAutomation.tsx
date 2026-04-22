import { useState } from 'react';
import {
  Play,
  Pause,
  Settings,
  RefreshCw,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Plus,
  ChevronDown,
  ChevronRight,
  Zap,
  Workflow,
  GitBranch,
  Timer,
  TrendingUp,
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
  mockSOCWorkflows,
  type SOCWorkflow,
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

export default function SOCWorkflowAutomation() {
  const [workflows] = useState<SOCWorkflow[]>(mockSOCWorkflows);
  const [selectedWorkflow, setSelectedWorkflow] = useState<SOCWorkflow | null>(workflows[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || workflow.type === filterType;
    const matchesStatus = filterStatus === 'all' || workflow.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    activeWorkflows: workflows.filter((w) => w.status === 'active').length,
    totalRuns: workflows.reduce((sum, w) => sum + w.runs, 0),
    avgDuration: Math.round(workflows.reduce((sum, w) => sum + w.avgDuration, 0) / workflows.length),
    successRate: 94,
  };

  const workflowTrend = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Runs',
        data: [145, 168, 152, 178, 195, 87, 65],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const workflowTypeDistribution = {
    labels: ['Alert Triage', 'Incident Response', 'Enrichment', 'Escalation'],
    datasets: [
      {
        data: [
          workflows.filter((w) => w.type === 'alert_triage').length,
          workflows.filter((w) => w.type === 'incident_response').length,
          workflows.filter((w) => w.type === 'enrichment').length,
          workflows.filter((w) => w.type === 'escalation').length,
        ],
        backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F97316'],
        borderWidth: 0,
      },
    ],
  };

  const performanceMetrics = [
    { name: 'Alert Triage', avgTime: '45s', efficiency: 92 },
    { name: 'Phishing Response', avgTime: '2m', efficiency: 88 },
    { name: 'IOC Enrichment', avgTime: '30s', efficiency: 95 },
    { name: 'Incident Escalation', avgTime: '1m', efficiency: 85 },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'alert_triage': return '#3B82F6';
      case 'incident_response': return '#10B981';
      case 'enrichment': return '#8B5CF6';
      case 'escalation': return '#F97316';
      default: return '#6B7280';
    }
  };

  const getTypeLabel = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <Workflow className="w-8 h-8 text-[var(--color-accent-blue)]" />
            SOC Workflow Automation
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Automate security operations workflows and playbook execution
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <Download size={16} />
            Export
          </button>
          <button className="btn btn-primary">
            <Plus size={16} />
            New Workflow
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-low-bg)] rounded-lg">
              <Activity size={20} className="text-[var(--color-low)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-low)]">{stats.activeWorkflows}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Active Workflows</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-info-bg)] rounded-lg">
              <Zap size={20} className="text-[var(--color-accent-blue)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalRuns.toLocaleString()}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Total Runs</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-medium-bg)] rounded-lg">
              <Timer size={20} className="text-[var(--color-medium)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.avgDuration}s</p>
              <p className="text-xs text-[var(--color-text-muted)]">Avg Duration</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-low-bg)] rounded-lg">
              <TrendingUp size={20} className="text-[var(--color-low)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-low)]">{stats.successRate}%</p>
              <p className="text-xs text-[var(--color-text-muted)]">Success Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow Trend */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Workflow Execution Trend</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Daily automation runs</p>
            </div>
          </div>
          <div className="h-64">
            <Line
              data={workflowTrend}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
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

        {/* Type Distribution */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Workflow Types</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Distribution by type</p>
          </div>
          <div className="h-48">
            <Doughnut
              data={workflowTypeDistribution}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: { legend: { display: false } },
              }}
            />
          </div>
          <div className="mt-4 space-y-2">
            {workflowTypeDistribution.labels.map((label, i) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: workflowTypeDistribution.datasets[0].backgroundColor[i] }}
                  />
                  <span>{label}</span>
                </div>
                <span className="font-medium">
                  {workflowTypeDistribution.datasets[0].data[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {performanceMetrics.map((metric) => (
            <div key={metric.name} className="p-4 bg-[var(--color-bg-elevated)] rounded-lg">
              <p className="font-medium text-sm">{metric.name}</p>
              <div className="flex items-center gap-4 mt-3">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Avg Time</p>
                  <p className="font-bold text-[var(--color-accent-blue)]">{metric.avgTime}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Efficiency</p>
                  <p className="font-bold text-[var(--color-low)]">{metric.efficiency}%</p>
                </div>
              </div>
            </div>
          ))}
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
              placeholder="Search workflows..."
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
            <option value="all">All Types</option>
            <option value="alert_triage">Alert Triage</option>
            <option value="incident_response">Incident Response</option>
            <option value="enrichment">Enrichment</option>
            <option value="escalation">Escalation</option>
          </select>
          <select
            className="select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredWorkflows.map((workflow) => (
          <div
            key={workflow.id}
            className={`card p-6 cursor-pointer transition-all ${
              selectedWorkflow?.id === workflow.id
                ? 'border-[var(--color-accent-blue)] ring-2 ring-[var(--color-accent-blue)]/30'
                : ''
            }`}
            onClick={() => setSelectedWorkflow(workflow)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${getTypeColor(workflow.type)}20` }}
                >
                  <GitBranch size={24} style={{ color: getTypeColor(workflow.type) }} />
                </div>
                <div>
                  <h3 className="font-semibold">{workflow.name}</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {getTypeLabel(workflow.type)}
                  </p>
                </div>
              </div>
              <span
                className={`badge ${
                  workflow.status === 'active' ? 'badge-low' : 'badge-medium'
                }`}
              >
                {workflow.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-[var(--color-bg-elevated)] rounded-lg">
                <p className="text-2xl font-bold">{workflow.runs.toLocaleString()}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Total Runs</p>
              </div>
              <div className="text-center p-3 bg-[var(--color-bg-elevated)] rounded-lg">
                <p className="text-2xl font-bold">{workflow.avgDuration}s</p>
                <p className="text-xs text-[var(--color-text-muted)]">Avg Duration</p>
              </div>
              <div className="text-center p-3 bg-[var(--color-bg-elevated)] rounded-lg">
                <p className="text-2xl font-bold">
                  {new Date(workflow.lastRun).toLocaleTimeString()}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">Last Run</p>
              </div>
            </div>

            <div className="flex gap-3">
              {workflow.status === 'active' ? (
                <button className="btn btn-secondary flex-1">
                  <Pause size={16} />
                  Pause
                </button>
              ) : (
                <button className="btn btn-primary flex-1">
                  <Play size={16} />
                  Activate
                </button>
              )}
              <button className="btn btn-ghost">
                <Settings size={16} />
              </button>
              <button className="btn btn-ghost">
                <Activity size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Workflow Details Panel */}
      {selectedWorkflow && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Workflow Details: {selectedWorkflow.name}</h2>
            <button className="btn btn-ghost">
              <ChevronDown size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workflow Steps */}
            <div>
              <h3 className="font-medium mb-4">Workflow Steps</h3>
              <div className="space-y-3">
                {[
                  { step: 1, name: 'Trigger', desc: 'Alert received from SIEM', status: 'completed' },
                  { step: 2, name: 'Enrich', desc: 'Gather IOC context', status: 'completed' },
                  { step: 3, name: 'Classify', desc: 'Categorize alert severity', status: 'active' },
                  { step: 4, name: 'Respond', desc: 'Take automated action', status: 'pending' },
                  { step: 5, name: 'Notify', desc: 'Alert relevant teams', status: 'pending' },
                ].map((item) => (
                  <div
                    key={item.step}
                    className={`flex items-center gap-4 p-3 rounded-lg ${
                      item.status === 'completed'
                        ? 'bg-[var(--color-low-bg)]'
                        : item.status === 'active'
                        ? 'bg-[var(--color-info-bg)]'
                        : 'bg-[var(--color-bg-elevated)]'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        item.status === 'completed'
                          ? 'bg-[var(--color-low)] text-white'
                          : item.status === 'active'
                          ? 'bg-[var(--color-accent-blue)] text-white animate-pulse'
                          : 'bg-[var(--color-bg-surface)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{item.desc}</p>
                    </div>
                    {item.status === 'completed' && (
                      <CheckCircle size={18} className="text-[var(--color-low)]" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Runs */}
            <div>
              <h3 className="font-medium mb-4">Recent Runs</h3>
              <div className="space-y-3">
                {[
                  { time: '2 min ago', status: 'completed', duration: '42s' },
                  { time: '15 min ago', status: 'completed', duration: '38s' },
                  { time: '1 hour ago', status: 'failed', duration: '15s' },
                  { time: '3 hours ago', status: 'completed', duration: '45s' },
                ].map((run, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-[var(--color-bg-elevated)] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {run.status === 'completed' ? (
                        <CheckCircle size={18} className="text-[var(--color-low)]" />
                      ) : (
                        <AlertTriangle size={18} className="text-[var(--color-critical)]" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{run.status === 'completed' ? 'Success' : 'Failed'}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{run.time}</p>
                      </div>
                    </div>
                    <span className="text-sm text-[var(--color-text-muted)]">{run.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
