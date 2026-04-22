import { useState } from 'react';
import {
  GraduationCap,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Play,
  Trophy,
  Users,
  BookOpen,
  BarChart3,
  TrendingUp,
  Calendar,
  ChevronRight,
  Video,
  FileText,
  Award,
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
  mockTrainingRecords,
  type TrainingRecord,
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

export default function SecurityTrainingTracker() {
  const [records] = useState<TrainingRecord[]>(mockTrainingRecords);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [timeRange, setTimeRange] = useState('30d');

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalEmployees: 245,
    trained: records.filter((r) => r.status === 'completed').length,
    inProgress: records.filter((r) => r.status === 'in_progress').length,
    overdue: records.filter((r) => r.status === 'overdue').length,
    notStarted: records.filter((r) => r.status === 'not_started').length,
    avgScore: 87,
    completionRate: 78,
  };

  const trainingTrend = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Completed',
        data: [45, 52, 68, 75, 82, 89],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'In Progress',
        data: [32, 28, 35, 42, 38, 45],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const completionByDepartment = {
    labels: ['Engineering', 'Sales', 'HR', 'Finance', 'Operations'],
    datasets: [
      {
        label: 'Completion %',
        data: [92, 78, 85, 88, 72],
        backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#EAB308'],
        borderRadius: 4,
      },
    ],
  };

  const statusDistribution = {
    labels: ['Completed', 'In Progress', 'Overdue', 'Not Started'],
    datasets: [
      {
        data: [stats.trained, stats.inProgress, stats.overdue, stats.notStarted],
        backgroundColor: ['#10B981', '#3B82F6', '#DC2626', '#6B7280'],
        borderWidth: 0,
      },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'var(--color-low)';
      case 'in_progress': return 'var(--color-accent-blue)';
      case 'overdue': return 'var(--color-critical)';
      case 'not_started': return 'var(--color-text-muted)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'completed': return 'var(--color-low-bg)';
      case 'in_progress': return 'var(--color-info-bg)';
      case 'overdue': return 'var(--color-critical-bg)';
      case 'not_started': return 'var(--color-bg-elevated)';
      default: return 'var(--color-bg-elevated)';
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-[var(--color-accent-blue)]" />
            Security Training Tracker
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Monitor employee security awareness training progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="select text-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="btn btn-secondary">
            <Download size={16} />
            Report
          </button>
          <button className="btn btn-primary">
            <Play size={16} />
            Assign Training
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-info-bg)] rounded-lg">
              <Users size={20} className="text-[var(--color-accent-blue)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalEmployees}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Total Employees</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-low-bg)] rounded-lg">
              <CheckCircle size={20} className="text-[var(--color-low)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-low)]">{stats.trained}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Completed</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-info-bg)] rounded-lg">
              <Clock size={20} className="text-[var(--color-accent-blue)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-accent-blue)]">{stats.inProgress}</p>
              <p className="text-xs text-[var(--color-text-muted)]">In Progress</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-critical-bg)] rounded-lg">
              <AlertTriangle size={20} className="text-[var(--color-critical)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-critical)]">{stats.overdue}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Overdue</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-medium-bg)] rounded-lg">
              <Trophy size={20} className="text-[var(--color-medium)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-medium)]">{stats.completionRate}%</p>
              <p className="text-xs text-[var(--color-text-muted)]">Completion Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Training Trend */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Training Progress Trend</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Completion over time</p>
            </div>
          </div>
          <div className="h-64">
            <Line
              data={trainingTrend}
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

        {/* Status Distribution */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Status Distribution</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Training status breakdown</p>
          </div>
          <div className="h-48">
            <Doughnut
              data={statusDistribution}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: { legend: { display: false } },
              }}
            />
          </div>
          <div className="mt-4 space-y-2">
            {statusDistribution.labels.map((label, i) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: statusDistribution.datasets[0].backgroundColor[i] }}
                  />
                  <span>{label}</span>
                </div>
                <span className="font-medium">
                  {statusDistribution.datasets[0].data[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Completion */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Completion by Department</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Training completion rate per department</p>
          </div>
        </div>
        <div className="h-64">
          <Bar
            data={completionByDepartment}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  grid: { color: 'rgba(107, 114, 128, 0.1)' },
                  ticks: { color: '#9CA3AF' },
                  max: 100,
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
              placeholder="Search by employee or course..."
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
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="overdue">Overdue</option>
            <option value="not_started">Not Started</option>
          </select>
        </div>
      </div>

      {/* Training Records Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)]">
          <h2 className="font-semibold">Training Records ({filteredRecords.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="security-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Course</th>
                <th>Progress</th>
                <th>Score</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-[var(--color-bg-elevated)]/50">
                  <td className="font-medium">{record.user}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-[var(--color-accent-blue)]" />
                      <span>{record.course}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="progress-bar w-20">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${record.completion}%`,
                            backgroundColor: getStatusColor(record.status),
                          }}
                        />
                      </div>
                      <span className="text-sm">{record.completion}%</span>
                    </div>
                  </td>
                  <td>
                    {record.score > 0 ? (
                      <span className="font-medium">{record.score}%</span>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">-</span>
                    )}
                  </td>
                  <td className="text-sm text-[var(--color-text-muted)]">
                    {new Date(record.dueDate).toLocaleDateString()}
                  </td>
                  <td>
                    <span
                      className="badge text-xs"
                      style={{
                        backgroundColor: getStatusBg(record.status),
                        color: getStatusColor(record.status),
                      }}
                    >
                      {record.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm">
                      View
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy size={20} className="text-[var(--color-medium)]" />
            Top Performers
          </h2>
          <div className="space-y-3">
            {[
              { name: 'Alice Chen', score: 98 },
              { name: 'Bob Wilson', score: 95 },
              { name: 'Carol Davis', score: 93 },
            ].map((performer, i) => (
              <div key={performer.name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--color-medium-bg)] flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{performer.name}</p>
                </div>
                <span className="font-bold text-[var(--color-medium)]">{performer.score}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-[var(--color-critical)]" />
            Needs Attention
          </h2>
          <div className="space-y-3">
            {records.filter((r) => r.status === 'overdue' || r.status === 'not_started').slice(0, 3).map((record) => (
              <div key={record.id} className="p-3 bg-[var(--color-critical-bg)] rounded-lg">
                <p className="font-medium text-sm">{record.user}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{record.course}</p>
                <p className="text-xs text-[var(--color-critical)] mt-1">
                  Due: {new Date(record.dueDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award size={20} className="text-[var(--color-low)]" />
            Recent Certifications
          </h2>
          <div className="space-y-3">
            {records.filter((r) => r.status === 'completed').slice(0, 3).map((record) => (
              <div key={record.id} className="flex items-center gap-3 p-3 bg-[var(--color-low-bg)] rounded-lg">
                <Award size={20} className="text-[var(--color-low)]" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{record.user}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{record.course}</p>
                </div>
                <span className="text-[var(--color-low)] font-bold">{record.score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
