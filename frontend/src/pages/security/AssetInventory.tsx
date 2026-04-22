import { useState } from 'react';
import {
  Server,
  Monitor,
  Cloud,
  Container,
  Cpu,
  Wifi,
  Search,
  Filter,
  Plus,
  Download,
  RefreshCw,
  MoreVertical,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
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
  mockAssets,
  getAssetTypeDistribution,
  type Asset,
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

export default function AssetInventory() {
  const [assets, setAssets] = useState<Asset[]>(mockAssets);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterClassification, setFilterClassification] = useState<string>('all');
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.ipAddress.includes(searchTerm) ||
      asset.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || asset.type === filterType;
    const matchesClass = filterClassification === 'all' || asset.classification === filterClassification;
    return matchesSearch && matchesType && matchesClass;
  });

  const assetDistribution = getAssetTypeDistribution();

  const assetTypeData = {
    labels: ['Servers', 'Workstations', 'Cloud', 'Containers', 'IoT', 'Network'],
    datasets: [
      {
        data: [
          assetDistribution.server,
          assetDistribution.workstation,
          assetDistribution.cloud,
          assetDistribution.container,
          assetDistribution.iot,
          assetDistribution.network,
        ],
        backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#EAB308', '#EC4899'],
        borderWidth: 0,
      },
    ],
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'server': return Server;
      case 'workstation': return Monitor;
      case 'cloud': return Cloud;
      case 'container': return Container;
      case 'iot': return Wifi;
      case 'network': return Cpu;
      default: return Server;
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'critical': return 'var(--color-critical)';
      case 'high': return 'var(--color-high)';
      case 'medium': return 'var(--color-medium)';
      case 'low': return 'var(--color-low)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'inactive': return Clock;
      case 'maintenance': return AlertTriangle;
      default: return Clock;
    }
  };

  const stats = {
    total: assets.length,
    critical: assets.filter((a) => a.classification === 'critical').length,
    withVulns: assets.filter((a) => a.vulnerabilities > 0).length,
    last24h: 3,
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <Server className="w-8 h-8 text-[var(--color-accent-blue)]" />
            Asset Inventory
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Manage and monitor your IT asset landscape
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <Download size={16} />
            Export
          </button>
          <button className="btn btn-secondary">
            <RefreshCw size={16} />
            Sync
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Asset
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-info-bg)] rounded-lg">
              <Server size={20} className="text-[var(--color-accent-blue)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Total Assets</p>
            </div>
          </div>
        </div>
        <div className="card p-4 border-l-4 border-l-[var(--color-critical)]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-critical-bg)] rounded-lg">
              <Shield size={20} className="text-[var(--color-critical)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-critical)]">{stats.critical}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Critical Assets</p>
            </div>
          </div>
        </div>
        <div className="card p-4 border-l-4 border-l-[var(--color-high)]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-high-bg)] rounded-lg">
              <AlertTriangle size={20} className="text-[var(--color-high)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-high)]">{stats.withVulns}</p>
              <p className="text-xs text-[var(--color-text-muted)]">With Vulnerabilities</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-low-bg)] rounded-lg">
              <RefreshCw size={20} className="text-[var(--color-low)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.last24h}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Added (24h)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Distribution */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Asset Distribution</h2>
            <p className="text-sm text-[var(--color-text-muted)]">By type</p>
          </div>
          <div className="h-48">
            <Doughnut
              data={assetTypeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: { legend: { display: false } },
              }}
            />
          </div>
          <div className="mt-4 space-y-2">
            {assetTypeData.labels.map((label, i) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: assetTypeData.datasets[0].backgroundColor[i] }}
                  />
                  <span>{label}</span>
                </div>
                <span className="font-medium">
                  {assetTypeData.datasets[0].data[i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Classification Overview */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Classification Overview</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Assets by business criticality</p>
            </div>
          </div>
          <div className="space-y-4">
            {['critical', 'high', 'medium', 'low'].map((level) => {
              const count = assets.filter((a) => a.classification === level).length;
              const percentage = (count / assets.length) * 100;
              return (
                <div key={level} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize" style={{ color: getClassificationColor(level) }}>
                      {level}
                    </span>
                    <span className="font-medium">{count} assets ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="progress-bar h-3">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: getClassificationColor(level),
                      }}
                    />
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
              placeholder="Search by name, IP, or tag..."
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
            <option value="server">Server</option>
            <option value="workstation">Workstation</option>
            <option value="cloud">Cloud</option>
            <option value="container">Container</option>
            <option value="iot">IoT</option>
            <option value="network">Network</option>
          </select>
          <select
            className="select"
            value={filterClassification}
            onChange={(e) => setFilterClassification(e.target.value)}
          >
            <option value="all">All Classifications</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Asset Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)]">
          <h2 className="font-semibold">Assets ({filteredAssets.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="security-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Type</th>
                <th>Classification</th>
                <th>IP Address</th>
                <th>Owner</th>
                <th>Vulnerabilities</th>
                <th>Status</th>
                <th>Last Scan</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => {
                const TypeIcon = getTypeIcon(asset.type);
                const StatusIcon = getStatusIcon(asset.status);
                const isExpanded = expandedAsset === asset.id;

                return (
                  <>
                    <tr key={asset.id} className="hover:bg-[var(--color-bg-elevated)]/50">
                      <td>
                        <button
                          className="flex items-center gap-3"
                          onClick={() => setExpandedAsset(isExpanded ? null : asset.id)}
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <TypeIcon size={18} className="text-[var(--color-accent-blue)]" />
                          <div>
                            <p className="font-medium">{asset.name}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">
                              {asset.os}
                            </p>
                          </div>
                        </button>
                      </td>
                      <td className="capitalize">{asset.type}</td>
                      <td>
                        <span
                          className="badge text-xs"
                          style={{
                            backgroundColor: `${getClassificationColor(asset.classification)}20`,
                            color: getClassificationColor(asset.classification),
                          }}
                        >
                          {asset.classification}
                        </span>
                      </td>
                      <td className="font-mono text-sm">{asset.ipAddress}</td>
                      <td>{asset.owner}</td>
                      <td>
                        {asset.vulnerabilities > 0 ? (
                          <span className="text-[var(--color-high)] font-medium">
                            {asset.vulnerabilities}
                          </span>
                        ) : (
                          <span className="text-[var(--color-low)]">0</span>
                        )}
                      </td>
                      <td>
                        <span className={`flex items-center gap-1 text-xs ${
                          asset.status === 'active' ? 'text-[var(--color-low)]' :
                          asset.status === 'inactive' ? 'text-[var(--color-text-muted)]' :
                          'text-[var(--color-medium)]'
                        }`}>
                          <StatusIcon size={14} />
                          {asset.status}
                        </span>
                      </td>
                      <td className="text-sm text-[var(--color-text-muted)]">
                        {new Date(asset.lastScan).toLocaleDateString()}
                      </td>
                      <td>
                        <button className="p-2 hover:bg-[var(--color-bg-elevated)] rounded">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${asset.id}-expanded`}>
                        <td colSpan={9} className="bg-[var(--color-bg-elevated)] p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-[var(--color-text-muted)]">Tags</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {asset.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 bg-[var(--color-bg-surface)] rounded text-xs"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-[var(--color-text-muted)]">Classification</p>
                              <p className="font-medium capitalize mt-1">{asset.classification}</p>
                            </div>
                            <div>
                              <p className="text-xs text-[var(--color-text-muted)]">Last Scan</p>
                              <p className="font-medium mt-1">
                                {new Date(asset.lastScan).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button className="btn btn-secondary btn-sm mt-6">
                                <Eye size={14} />
                                Details
                              </button>
                              <button className="btn btn-ghost btn-sm mt-6">
                                <Edit size={14} />
                                Edit
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
