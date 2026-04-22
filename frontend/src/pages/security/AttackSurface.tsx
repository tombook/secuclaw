import { useState } from 'react';
import {
  Globe, Server, Shield, AlertTriangle, ExternalLink, Search, RefreshCw, Eye, Activity, ChevronDown, ChevronRight, Globe2, Certificate, MapPin, Calendar,
} from 'lucide-react';
import { mockAttackSurface, type AttackSurfaceEntry } from '../../api/securityData';

export default function AttackSurface() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredEntries = mockAttackSurface.filter((entry) => {
    const matchesSearch = entry.value.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'all' || entry.risk === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const riskCounts = {
    critical: mockAttackSurface.filter((e) => e.risk === 'critical').length,
    high: mockAttackSurface.filter((e) => e.risk === 'high').length,
    medium: mockAttackSurface.filter((e) => e.risk === 'medium').length,
    low: mockAttackSurface.filter((e) => e.risk === 'low').length,
  };

  const riskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'var(--color-critical)';
      case 'high': return 'var(--color-high)';
      case 'medium': return 'var(--color-medium)';
      case 'low': return 'var(--color-low)';
      default: return 'var(--color-text-muted)';
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Globe className="w-8 h-8 text-[var(--color-accent-blue)]" />
            Attack Surface Management
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">Discover and monitor external-facing assets</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary"><RefreshCw size={16} /> Refresh Scan</button>
          <button className="btn btn-primary"><Activity size={16} /> New Discovery</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <RiskCard title="Critical Risk" count={riskCounts.critical} color="var(--color-critical)" icon={AlertTriangle} />
        <RiskCard title="High Risk" count={riskCounts.high} color="var(--color-high)" icon={Shield} />
        <RiskCard title="Medium Risk" count={riskCounts.medium} color="var(--color-medium)" icon={Eye} />
        <RiskCard title="Low Risk" count={riskCounts.low} color="var(--color-low)" icon={Server} />
      </div>

      <div className="card p-6 bg-gradient-to-r from-[var(--color-bg-tertiary)] to-[var(--color-bg-card)]">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-lg font-semibold">External Exposure Score</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Overall attack surface risk rating</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-[var(--color-medium)]">68</p>
              <p className="text-xs text-[var(--color-text-muted)]">EXPOSURE</p>
            </div>
            <div className="h-16 w-px bg-[var(--color-border)]" />
            <div className="text-center">
              <p className="text-4xl font-bold">{mockAttackSurface.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">TOTAL</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input type="search" placeholder="Search assets..." className="input pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="select" value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
            <option value="all">All Risks</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
          <h2 className="font-semibold">Discovered Assets ({filteredEntries.length})</h2>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {filteredEntries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            return (
              <div key={entry.id} className="hover:bg-[var(--color-bg-tertiary)]/50 transition-colors">
                <button className="w-full p-4 flex items-center gap-4 text-left" onClick={() => setExpandedId(isExpanded ? null : entry.id)}>
                  <Globe2 size={20} className="text-[var(--color-accent-blue)]" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{entry.value}</span>
                      <span className={`badge badge-${entry.risk}`}>{entry.risk}</span>
                      {entry.exposed && <span className="badge badge-critical">EXPOSED</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-[var(--color-text-muted)]">
                      <span className="capitalize">{entry.type}</span>
                      <span>{entry.vulnerabilities} vulns</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RiskCard({ title, count, color, icon: Icon }: { title: string; count: number; color: string; icon: React.ElementType }) {
  return (
    <div className="card p-4 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">{title}</p>
          <p className="text-2xl font-bold mt-1" style={{ color }}>{count}</p>
        </div>
        <Icon size={24} style={{ color }} className="opacity-50" />
      </div>
    </div>
  );
}
