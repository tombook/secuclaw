import { useState } from 'react';
import {
  Building2,
  Shield,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  ExternalLink,
  Calendar,
  FileText,
  Clock,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Scale,
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
  mockVendors,
  type Vendor,
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

export default function VendorRiskAssessment() {
  const [vendors] = useState<Vendor[]>(mockVendors);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [timeRange, setTimeRange] = useState('90d');

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'all' || vendor.criticality === filterRisk;
    const matchesStatus = filterStatus === 'all' || vendor.status === filterStatus;
    return matchesSearch && matchesRisk && matchesStatus;
  });

  const stats = {
    totalVendors: vendors.length,
    critical: vendors.filter((v) => v.criticality === 'critical').length,
    high: vendors.filter((v) => v.criticality === 'high').length,
    underReview: vendors.filter((v) => v.status === 'under_review').length,
    expiringContracts: 2,
    avgRiskScore: Math.round(vendors.reduce((sum, v) => sum + v.riskScore, 0) / vendors.length),
  };

  const vendorRiskTrend = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Average Risk Score',
        data: [42, 38, 35, 32, 30, 28],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const criticalityDistribution = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        data: [
          vendors.filter((v) => v.criticality === 'critical').length,
          vendors.filter((v) => v.criticality === 'high').length,
          vendors.filter((v) => v.criticality === 'medium').length,
          vendors.filter((v) => v.criticality === 'low').length,
        ],
        backgroundColor: ['#DC2626', '#F97316', '#EAB308', '#10B981'],
        borderWidth: 0,
      },
    ],
  };

  const assessmentStatus = {
    labels: ['Approved', 'Pending', 'Under Review', 'Rejected'],
    datasets: [
      {
        data: [
          vendors.filter((v) => v.status === 'approved').length,
          vendors.filter((v) => v.status === 'pending').length,
          vendors.filter((v) => v.status === 'under_review').length,
          vendors.filter((v) => v.status === 'rejected').length,
        ],
        backgroundColor: ['#10B981', '#EAB308', '#3B82F6', '#DC2626'],
        borderWidth: 0,
      },
    ],
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'var(--color-critical)';
    if (score >= 40) return 'var(--color-high)';
    if (score >= 25) return 'var(--color-medium)';
    return 'var(--color-low)';
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'critical': return 'var(--color-critical)';
      case 'high': return 'var(--color-high)';
      case 'medium': return 'var(--color-medium)';
      case 'low': return 'var(--color-low)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'var(--color-low)';
      case 'pending': return 'var(--color-medium)';
      case 'under_review': return 'var(--color-accent-blue)';
      case 'rejected': return 'var(--color-critical)';
      default: return 'var(--color-text-muted)';
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <Building2 className="w-8 h-8 text-[var(--color-accent-blue)]" />
            Vendor Risk Assessment
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Third-party risk management and vendor security assessment
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
            Export
          </button>
          <button className="btn btn-primary">
            <Shield size={16} />
            New Assessment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-info-bg)] rounded-lg">
              <Building2 size={20} className="text-[var(--color-accent-blue)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalVendors}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Total Vendors</p>
            </div>
          </div>
        </div>
        <div className="card p-4 border-l-4 border-l-[var(--color-critical)]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-critical-bg)] rounded-lg">
              <AlertTriangle size={20} className="text-[var(--color-critical)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-critical)]">{stats.critical}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Critical</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-high-bg)] rounded-lg">
              <AlertCircle size={20} className="text-[var(--color-high)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-high)]">{stats.underReview}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Under Review</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-medium-bg)] rounded-lg">
              <Calendar size={20} className="text-[var(--color-medium)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-medium)]">{stats.expiringContracts}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Expiring Soon</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-low-bg)] rounded-lg">
              <Scale size={20} className="text-[var(--color-low)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-low)]">{stats.avgRiskScore}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Avg Risk Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Score Trend */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Vendor Risk Score Trend</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Overall risk reduction over time</p>
            </div>
            <div className="flex items-center gap-2 text-[var(--color-low)]">
              <TrendingDown size={18} />
              <span className="font-medium">-33% since Jan</span>
            </div>
          </div>
          <div className="h-64">
            <Line
              data={vendorRiskTrend}
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
                    max: 60,
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

        {/* Criticality Distribution */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Criticality Distribution</h2>
            <p className="text-sm text-[var(--color-text-muted)]">By business criticality</p>
          </div>
          <div className="h-48">
            <Doughnut
              data={criticalityDistribution}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: { legend: { display: false } },
              }}
            />
          </div>
          <div className="mt-4 space-y-2">
            {criticalityDistribution.labels.map((label, i) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: criticalityDistribution.datasets[0].backgroundColor[i] }}
                  />
                  <span>{label}</span>
                </div>
                <span className="font-medium">
                  {criticalityDistribution.datasets[0].data[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assessment Status */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Assessment Status</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Vendor approval pipeline</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {assessmentStatus.labels.map((label, i) => (
            <div
              key={label}
              className="p-4 rounded-lg"
              style={{ backgroundColor: `${assessmentStatus.datasets[0].backgroundColor[i]}20` }}
            >
              <p className="text-2xl font-bold" style={{ color: assessmentStatus.datasets[0].backgroundColor[i] }}>
                {assessmentStatus.datasets[0].data[i]}
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
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
              placeholder="Search vendors..."
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
            <option value="all">All Criticality</option>
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
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)]">
          <h2 className="font-semibold">Vendors ({filteredVendors.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="security-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Category</th>
                <th>Criticality</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>Contract Expiry</th>
                <th>Last Assessment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-[var(--color-bg-elevated)]/50">
                  <td>
                    <div className="flex items-center gap-3">
                      <Building2 size={18} className="text-[var(--color-accent-blue)]" />
                      <span className="font-medium">{vendor.name}</span>
                    </div>
                  </td>
                  <td>{vendor.category}</td>
                  <td>
                    <span
                      className="badge text-xs"
                      style={{
                        backgroundColor: `${getCriticalityColor(vendor.criticality)}20`,
                        color: getCriticalityColor(vendor.criticality),
                      }}
                    >
                      {vendor.criticality}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${vendor.riskScore}%`,
                            backgroundColor: getRiskScoreColor(vendor.riskScore),
                          }}
                        />
                      </div>
                      <span
                        className="font-bold"
                        style={{ color: getRiskScoreColor(vendor.riskScore) }}
                      >
                        {vendor.riskScore}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      className="badge text-xs"
                      style={{
                        backgroundColor: `${getStatusColor(vendor.status)}20`,
                        color: getStatusColor(vendor.status),
                      }}
                    >
                      {vendor.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="text-sm">
                    {new Date(vendor.contractExpiry).toLocaleDateString()}
                  </td>
                  <td className="text-sm text-[var(--color-text-muted)]">
                    {new Date(vendor.lastAssessment).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-sm">
                        <FileText size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm">
                        <Shield size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm">
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Alerts */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-[var(--color-high)]" />
          Vendor Risk Alerts
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {vendors.filter((v) => v.riskScore > 50 || v.status === 'under_review').map((vendor) => (
            <div
              key={vendor.id}
              className="p-4 bg-[var(--color-high-bg)] rounded-lg border border-[var(--color-high)]/30"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{vendor.name}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">{vendor.category}</p>
                </div>
                <span
                  className="badge"
                  style={{
                    backgroundColor: `${getRiskScoreColor(vendor.riskScore)}20`,
                    color: getRiskScoreColor(vendor.riskScore),
                  }}
                >
                  Risk: {vendor.riskScore}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-[var(--color-text-muted)]">
                  Assessment: {new Date(vendor.lastAssessment).toLocaleDateString()}
                </span>
                <button className="btn btn-sm btn-secondary">
                  Review
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
