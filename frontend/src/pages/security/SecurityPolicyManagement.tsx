import { useState } from 'react';
import {
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Edit,
  Eye,
  Clock,
  Calendar,
  User,
  ChevronRight,
  BookOpen,
  Lock,
  Send,
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
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  mockPolicies,
  type SecurityPolicy,
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

export default function SecurityPolicyManagement() {
  const [policies] = useState<SecurityPolicy[]>(mockPolicies);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedPolicy, setSelectedPolicy] = useState<SecurityPolicy | null>(null);

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || policy.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || policy.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const stats = {
    totalPolicies: policies.length,
    published: policies.filter((p) => p.status === 'published').length,
    underReview: policies.filter((p) => p.status === 'review' || p.status === 'approved').length,
    drafts: policies.filter((p) => p.status === 'draft').length,
    lastUpdated: new Date(Math.max(...policies.map((p) => new Date(p.lastUpdated).getTime()))),
  };

  const policyStatusDistribution = {
    labels: ['Published', 'Approved', 'In Review', 'Draft'],
    datasets: [
      {
        data: [
          policies.filter((p) => p.status === 'published').length,
          policies.filter((p) => p.status === 'approved').length,
          policies.filter((p) => p.status === 'review').length,
          policies.filter((p) => p.status === 'draft').length,
        ],
        backgroundColor: ['#10B981', '#3B82F6', '#EAB308', '#6B7280'],
        borderWidth: 0,
      },
    ],
  };

  const policiesByCategory = {
    labels: ['Governance', 'Usage', 'Data', 'Response', 'Access'],
    datasets: [
      {
        data: [
          policies.filter((p) => p.category === 'Governance').length,
          policies.filter((p) => p.category === 'Usage').length,
          policies.filter((p) => p.category === 'Data').length,
          policies.filter((p) => p.category === 'Response').length,
          policies.filter((p) => p.category === 'Access').length,
        ],
        backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#EAB308'],
        borderRadius: 4,
      },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'var(--color-low)';
      case 'approved': return 'var(--color-accent-blue)';
      case 'review': return 'var(--color-medium)';
      case 'draft': return 'var(--color-text-muted)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'published': return 'var(--color-low-bg)';
      case 'approved': return 'var(--color-info-bg)';
      case 'review': return 'var(--color-medium-bg)';
      case 'draft': return 'var(--color-bg-elevated)';
      default: return 'var(--color-bg-elevated)';
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-[var(--color-accent-blue)]" />
            Security Policy Management
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Create, manage, and track security policies and compliance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <Download size={16} />
            Export
          </button>
          <button className="btn btn-primary">
            <Plus size={16} />
            New Policy
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-info-bg)] rounded-lg">
              <FileText size={20} className="text-[var(--color-accent-blue)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalPolicies}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Total Policies</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-low-bg)] rounded-lg">
              <CheckCircle size={20} className="text-[var(--color-low)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-low)]">{stats.published}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Published</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-medium-bg)] rounded-lg">
              <Clock size={20} className="text-[var(--color-medium)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-medium)]">{stats.underReview}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Under Review</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-bg-elevated)] rounded-lg">
              <RefreshCw size={20} className="text-[var(--color-text-muted)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.drafts}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Drafts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Policy Status</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Distribution by status</p>
          </div>
          <div className="h-48">
            <Doughnut
              data={policyStatusDistribution}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: { legend: { display: false } },
              }}
            />
          </div>
          <div className="mt-4 space-y-2">
            {policyStatusDistribution.labels.map((label, i) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: policyStatusDistribution.datasets[0].backgroundColor[i] }}
                  />
                  <span>{label}</span>
                </div>
                <span className="font-medium">
                  {policyStatusDistribution.datasets[0].data[i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* By Category */}
        <div className="lg:col-span-2 card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Policies by Category</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Distribution by policy category</p>
          </div>
          <div className="h-64">
            <Bar
              data={policiesByCategory}
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

      {/* Recent Activity */}
      <div className="card p-6 bg-gradient-to-r from-[var(--color-bg-elevated)] to-[var(--color-bg-surface)]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[var(--color-info-bg)] rounded-lg">
            <Clock size={24} className="text-[var(--color-accent-blue)]" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">Recent Policy Updates</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Last updated: {stats.lastUpdated.toLocaleDateString()}
            </p>
          </div>
          <button className="btn btn-secondary">
            View History
          </button>
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="approved">Approved</option>
            <option value="review">In Review</option>
            <option value="draft">Draft</option>
          </select>
          <select
            className="select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Governance">Governance</option>
            <option value="Usage">Usage</option>
            <option value="Data">Data</option>
            <option value="Response">Response</option>
            <option value="Access">Access</option>
          </select>
        </div>
      </div>

      {/* Policies List */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)]">
          <h2 className="font-semibold">Policies ({filteredPolicies.length})</h2>
        </div>
        <div className="divide-y divide-[var(--color-border-primary)]">
          {filteredPolicies.map((policy) => (
            <div
              key={policy.id}
              className="p-4 hover:bg-[var(--color-bg-elevated)]/50 transition-colors cursor-pointer"
              onClick={() => setSelectedPolicy(policy)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[var(--color-info-bg)] rounded-lg">
                    <FileText size={20} className="text-[var(--color-accent-blue)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{policy.title}</h3>
                      <span
                        className="badge text-xs"
                        style={{
                          backgroundColor: getStatusBg(policy.status),
                          color: getStatusColor(policy.status),
                        }}
                      >
                        {policy.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1">
                        <Lock size={14} />
                        {policy.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {policy.owner}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        v{policy.version}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(policy.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn btn-ghost btn-sm">
                    <Eye size={14} />
                  </button>
                  <button className="btn btn-ghost btn-sm">
                    <Edit size={14} />
                  </button>
                  <button className="btn btn-ghost btn-sm">
                    <Send size={14} />
                  </button>
                  <ChevronRight size={20} className="text-[var(--color-text-muted)]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield size={20} className="text-[var(--color-accent-blue)]" />
            Compliance Status
          </h2>
          <div className="space-y-4">
            {['SOC 2', 'ISO 27001', 'NIST CSF', 'PCI-DSS'].map((framework) => (
              <div key={framework} className="flex items-center justify-between">
                <span className="text-sm">{framework}</span>
                <span className="badge badge-low">Compliant</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-[var(--color-low)]" />
            Ready for Review
          </h2>
          <div className="space-y-3">
            {policies.filter((p) => p.status === 'approved').map((policy) => (
              <div key={policy.id} className="p-3 bg-[var(--color-info-bg)] rounded-lg">
                <p className="font-medium text-sm">{policy.title}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{policy.category}</p>
              </div>
            ))}
            {policies.filter((p) => p.status === 'approved').length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)]">No policies ready for review</p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-[var(--color-medium)]" />
            Needs Attention
          </h2>
          <div className="space-y-3">
            {policies.filter((p) => p.status === 'draft').map((policy) => (
              <div key={policy.id} className="p-3 bg-[var(--color-medium-bg)] rounded-lg">
                <p className="font-medium text-sm">{policy.title}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Draft - needs review</p>
              </div>
            ))}
            {policies.filter((p) => p.status === 'draft').length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)]">All drafts are complete</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
