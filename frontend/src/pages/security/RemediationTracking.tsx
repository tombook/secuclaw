import { useState } from 'react';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Plus,
  User,
  Calendar,
  Target,
  TrendingUp,
  Play,
  Edit,
  ChevronRight,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import {
  mockRemediationTasks,
  mockVulnerabilities,
  type RemediationTask,
} from '../../api/securityData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function RemediationTracking() {
  const [tasks] = useState<RemediationTask[]>(mockRemediationTasks);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    review: tasks.filter((t) => t.status === 'review').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  const remediationTrend = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [
      {
        label: 'Completed',
        data: [5, 8, 12, 15, 18, 22],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'In Progress',
        data: [12, 10, 8, 6, 5, 4],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const priorityDistribution = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        label: 'Tasks',
        data: [
          tasks.filter((t) => t.priority === 'critical').length,
          tasks.filter((t) => t.priority === 'high').length,
          tasks.filter((t) => t.priority === 'medium').length,
          tasks.filter((t) => t.priority === 'low').length,
        ],
        backgroundColor: ['#DC2626', '#F97316', '#EAB308', '#10B981'],
        borderRadius: 4,
      },
    ],
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'var(--color-critical)';
      case 'high': return 'var(--color-high)';
      case 'medium': return 'var(--color-medium)';
      case 'low': return 'var(--color-low)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'var(--color-text-muted)';
      case 'in_progress': return 'var(--color-accent-blue)';
      case 'review': return 'var(--color-medium)';
      case 'done': return 'var(--color-low)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'todo': return 'var(--color-bg-elevated)';
      case 'in_progress': return 'var(--color-info-bg)';
      case 'review': return 'var(--color-medium-bg)';
      case 'done': return 'var(--color-low-bg)';
      default: return 'var(--color-bg-elevated)';
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <Target className="w-8 h-8 text-[var(--color-accent-blue)]" />
            Remediation Tracking
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Track and manage vulnerability remediation progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <Download size={16} />
            Export
          </button>
          <button className="btn btn-primary">
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-info-bg)] rounded-lg">
              <Target size={20} className="text-[var(--color-accent-blue)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Total Tasks</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-bg-elevated)] rounded-lg">
              <Clock size={20} className="text-[var(--color-text-muted)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.todo}</p>
              <p className="text-xs text-[var(--color-text-muted)]">To Do</p>
            </div>
          </div>
        </div>
        <div className="card p-4 border-l-4 border-l-[var(--color-accent-blue)]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-info-bg)] rounded-lg">
              <Play size={20} className="text-[var(--color-accent-blue)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-accent-blue)]">{stats.inProgress}</p>
              <p className="text-xs text-[var(--color-text-muted)]">In Progress</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-medium-bg)] rounded-lg">
              <AlertTriangle size={20} className="text-[var(--color-medium)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-medium)]">{stats.review}</p>
              <p className="text-xs text-[var(--color-text-muted)]">In Review</p>
            </div>
          </div>
        </div>
        <div className="card p-4 border-l-4 border-l-[var(--color-low)]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-low-bg)] rounded-lg">
              <CheckCircle size={20} className="text-[var(--color-low)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-low)]">{stats.done}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Remediation Trend */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Remediation Trend</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Progress over time</p>
            </div>
          </div>
          <div className="h-64">
            <Line
              data={remediationTrend}
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

        {/* Priority Distribution */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Priority Distribution</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Tasks by priority level</p>
            </div>
          </div>
          <div className="h-64">
            <Bar
              data={priorityDistribution}
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
              placeholder="Search tasks..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="select"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            className="select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">In Review</option>
            <option value="done">Completed</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)]">
          <h2 className="font-semibold">Remediation Tasks ({filteredTasks.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="security-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Vulnerability</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-[var(--color-bg-elevated)]/50">
                  <td className="font-medium">{task.title}</td>
                  <td className="font-mono text-sm text-[var(--color-accent-blue)]">
                    {task.vulnerabilityId}
                  </td>
                  <td>
                    <span
                      className="badge text-xs"
                      style={{
                        backgroundColor: `${getPriorityColor(task.priority)}20`,
                        color: getPriorityColor(task.priority),
                      }}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-[var(--color-text-muted)]" />
                      {task.assignee}
                    </div>
                  </td>
                  <td className="text-sm text-[var(--color-text-muted)]">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </td>
                  <td>
                    <span
                      className="badge text-xs"
                      style={{
                        backgroundColor: getStatusBg(task.status),
                        color: getStatusColor(task.status),
                      }}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {task.status === 'todo' && (
                        <button className="btn btn-ghost btn-sm">
                          <Play size={14} />
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <button className="btn btn-ghost btn-sm">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm">
                        <Edit size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLA Compliance */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">SLA Compliance</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { priority: 'Critical', sla: '24h', compliance: 92 },
            { priority: 'High', sla: '7d', compliance: 88 },
            { priority: 'Medium', sla: '30d', compliance: 95 },
            { priority: 'Low', sla: '90d', compliance: 100 },
          ].map((item) => (
            <div key={item.priority} className="p-4 bg-[var(--color-bg-elevated)] rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{item.priority}</span>
                <span className="text-sm text-[var(--color-text-muted)]">SLA: {item.sla}</span>
              </div>
              <div className="progress-bar h-2 mb-2">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${item.compliance}%`,
                    backgroundColor:
                      item.compliance >= 90
                        ? 'var(--color-low)'
                        : item.compliance >= 70
                        ? 'var(--color-medium)'
                        : 'var(--color-critical)',
                  }}
                />
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">{item.compliance}% on time</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
