import { useState } from 'react';
import {
  Network,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  ChevronRight,
  Lock,
  Unlock,
  Server,
  User,
  Globe,
  Database,
  Cloud,
  Laptop,
} from 'lucide-react';

interface ThreatNode {
  id: string;
  type: 'asset' | 'threat' | 'control' | 'vulnerability';
  label: string;
  x: number;
  y: number;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  status?: 'mitigated' | 'partial' | 'unmitigated';
}

interface ThreatEdge {
  from: string;
  to: string;
  label?: string;
  type: 'exploits' | 'mitigates' | 'affects' | 'connects';
}

export default function ThreatModelVisualization() {
  const [selectedNode, setSelectedNode] = useState<ThreatNode | null>(null);
  const [viewMode, setViewMode] = useState<'diagram' | 'list'>('diagram');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [zoom, setZoom] = useState(1);

  const nodes: ThreatNode[] = [
    // Assets
    { id: 'web-server', type: 'asset', label: 'Web Server', x: 400, y: 100, status: 'partial' },
    { id: 'database', type: 'asset', label: 'Database', x: 600, y: 200, status: 'unmitigated', severity: 'critical' },
    { id: 'api-gateway', type: 'asset', label: 'API Gateway', x: 200, y: 200, status: 'mitigated' },
    { id: 'user-endpoint', type: 'asset', label: 'User Endpoint', x: 100, y: 350, status: 'partial' },
    { id: 'cloud-storage', type: 'asset', label: 'Cloud Storage', x: 700, y: 350, status: 'unmitigated', severity: 'high' },
    
    // Vulnerabilities
    { id: 'sql-vuln', type: 'vulnerability', label: 'SQL Injection', x: 500, y: 280, severity: 'critical', status: 'partial' },
    { id: 'xss-vuln', type: 'vulnerability', label: 'XSS Vulnerability', x: 300, y: 280, severity: 'high', status: 'mitigated' },
    { id: 'auth-vuln', type: 'vulnerability', label: 'Weak Auth', x: 200, y: 430, severity: 'medium', status: 'unmitigated' },
    
    // Threats
    { id: 'attacker-ext', type: 'threat', label: 'External Attacker', x: 100, y: 500, severity: 'high' },
    { id: 'attacker-int', type: 'threat', label: 'Insider Threat', x: 700, y: 500, severity: 'critical' },
    
    // Controls
    { id: 'waf-control', type: 'control', label: 'WAF', x: 400, y: 400, status: 'mitigated' },
    { id: 'ids-control', type: 'control', label: 'IDS/IPS', x: 500, y: 450, status: 'partial' },
    { id: 'iam-control', type: 'control', label: 'IAM/MFA', x: 200, y: 500, status: 'partial' },
  ];

  const edges: ThreatEdge[] = [
    { from: 'attacker-ext', to: 'web-server', type: 'connects', label: 'HTTP/S' },
    { from: 'attacker-ext', to: 'api-gateway', type: 'connects', label: 'REST API' },
    { from: 'attacker-int', to: 'database', type: 'connects', label: 'SQL' },
    { from: 'web-server', to: 'sql-vuln', type: 'exploits' },
    { from: 'web-server', to: 'xss-vuln', type: 'exploits' },
    { from: 'user-endpoint', to: 'auth-vuln', type: 'exploits' },
    { from: 'sql-vuln', to: 'database', type: 'affects', label: 'Data Breach' },
    { from: 'xss-vuln', to: 'user-endpoint', type: 'affects', label: 'Session Hijack' },
    { from: 'waf-control', to: 'sql-vuln', type: 'mitigates' },
    { from: 'waf-control', to: 'xss-vuln', type: 'mitigates' },
    { from: 'ids-control', to: 'attacker-ext', type: 'mitigates' },
    { from: 'iam-control', to: 'auth-vuln', type: 'mitigates' },
    { from: 'cloud-storage', to: 'attacker-int', type: 'connects' },
  ];

  const getNodeColor = (node: ThreatNode) => {
    if (node.type === 'threat') {
      return { bg: '#DC2626', border: '#DC2626', text: '#fff' };
    }
    if (node.type === 'vulnerability') {
      switch (node.severity) {
        case 'critical': return { bg: '#DC2626', border: '#DC2626', text: '#fff' };
        case 'high': return { bg: '#F97316', border: '#F97316', text: '#fff' };
        case 'medium': return { bg: '#EAB308', border: '#EAB308', text: '#000' };
        case 'low': return { bg: '#10B981', border: '#10B981', text: '#fff' };
      }
    }
    if (node.type === 'control') {
      return { bg: '#3B82F6', border: '#3B82F6', text: '#fff' };
    }
    // Asset
    switch (node.status) {
      case 'mitigated': return { bg: '#10B981', border: '#10B981', text: '#fff' };
      case 'partial': return { bg: '#EAB308', border: '#EAB308', text: '#000' };
      case 'unmitigated': return { bg: '#DC2626', border: '#DC2626', text: '#fff' };
      default: return { bg: '#6B7280', border: '#6B7280', text: '#fff' };
    }
  };

  const getNodeIcon = (node: ThreatNode) => {
    if (node.type === 'threat') return AlertTriangle;
    if (node.type === 'vulnerability') return Lock;
    if (node.type === 'control') return Shield;
    if (node.label.includes('Server')) return Server;
    if (node.label.includes('Database')) return Database;
    if (node.label.includes('Cloud')) return Cloud;
    if (node.label.includes('User') || node.label.includes('Endpoint')) return Laptop;
    if (node.label.includes('API')) return Network;
    return Server;
  };

  const getEdgeColor = (edge: ThreatEdge) => {
    switch (edge.type) {
      case 'exploits': return '#DC2626';
      case 'mitigates': return '#10B981';
      case 'affects': return '#F97316';
      default: return '#6B7280';
    }
  };

  const threatStats = {
    totalThreats: nodes.filter(n => n.type === 'threat').length,
    totalVulnerabilities: nodes.filter(n => n.type === 'vulnerability').length,
    mitigated: nodes.filter(n => n.status === 'mitigated').length,
    unmitigated: nodes.filter(n => n.status === 'unmitigated').length,
    criticalRisks: nodes.filter(n => n.severity === 'critical').length,
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => direction === 'in' ? Math.min(prev + 0.2, 2) : Math.max(prev - 0.2, 0.5));
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <Network className="w-8 h-8 text-[var(--color-accent-blue)]" />
            Threat Model Visualization
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Visualize threat actors, vulnerabilities, and security controls
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[var(--color-bg-elevated)] rounded-lg p-1">
            <button
              className={`px-3 py-1 rounded text-sm ${viewMode === 'diagram' ? 'bg-[var(--color-accent-blue)] text-white' : ''}`}
              onClick={() => setViewMode('diagram')}
            >
              Diagram
            </button>
            <button
              className={`px-3 py-1 rounded text-sm ${viewMode === 'list' ? 'bg-[var(--color-accent-blue)] text-white' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
          <button className="btn btn-secondary">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4 border-l-4 border-l-[var(--color-critical)]">
          <p className="text-sm text-[var(--color-text-muted)]">Threat Actors</p>
          <p className="text-2xl font-bold text-[var(--color-critical)]">{threatStats.totalThreats}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-[var(--color-high)]">
          <p className="text-sm text-[var(--color-text-muted)]">Vulnerabilities</p>
          <p className="text-2xl font-bold text-[var(--color-high)]">{threatStats.totalVulnerabilities}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-[var(--color-low)]">
          <p className="text-sm text-[var(--color-text-muted)]">Mitigated</p>
          <p className="text-2xl font-bold text-[var(--color-low)]">{threatStats.mitigated}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-[var(--color-critical)]">
          <p className="text-sm text-[var(--color-text-muted)]">Unmitigated</p>
          <p className="text-2xl font-bold text-[var(--color-critical)]">{threatStats.unmitigated}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-[var(--color-critical)]">
          <p className="text-sm text-[var(--color-text-muted)]">Critical Risks</p>
          <p className="text-2xl font-bold text-[var(--color-critical)]">{threatStats.criticalRisks}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#DC2626]" />
            <span className="text-sm">Threat Actor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#F97316]" />
            <span className="text-sm">High Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#3B82F6]" />
            <span className="text-sm">Security Control</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#10B981]" />
            <span className="text-sm">Mitigated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#DC2626]" />
            <span className="text-sm">Unmitigated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-[#DC2626]" />
            <span className="text-sm">Exploits</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-[#10B981]" />
            <span className="text-sm">Mitigates</span>
          </div>
        </div>
      </div>

      {viewMode === 'diagram' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Diagram Canvas */}
          <div className="lg:col-span-3 card overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)] flex items-center justify-between">
              <h2 className="font-semibold">Threat Model Diagram</h2>
              <div className="flex items-center gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => handleZoom('out')}>
                  <ZoomOut size={16} />
                </button>
                <span className="text-sm text-[var(--color-text-muted)]">{Math.round(zoom * 100)}%</span>
                <button className="btn btn-ghost btn-sm" onClick={() => handleZoom('in')}>
                  <ZoomIn size={16} />
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setZoom(1)}>
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
            <div 
              className="relative bg-[var(--color-bg-surface)] overflow-auto"
              style={{ height: '600px' }}
            >
              <svg 
                width="100%" 
                height="100%" 
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
              >
                {/* Edges */}
                {edges.map((edge, i) => {
                  const fromNode = nodes.find(n => n.id === edge.from);
                  const toNode = nodes.find(n => n.id === edge.to);
                  if (!fromNode || !toNode) return null;
                  
                  const dx = toNode.x - fromNode.x;
                  const dy = toNode.y - fromNode.y;
                  const midX = (fromNode.x + toNode.x) / 2;
                  const midY = (fromNode.y + toNode.y) / 2;
                  
                  return (
                    <g key={i}>
                      <line
                        x1={fromNode.x}
                        y1={fromNode.y}
                        x2={toNode.x}
                        y2={toNode.y}
                        stroke={getEdgeColor(edge)}
                        strokeWidth={2}
                        strokeDasharray={edge.type === 'mitigates' ? '5,5' : 'none'}
                        markerEnd={`url(#arrowhead-${edge.type})`}
                      />
                      {edge.label && (
                        <text
                          x={midX}
                          y={midY - 8}
                          fill="#9CA3AF"
                          fontSize="10"
                          textAnchor="middle"
                        >
                          {edge.label}
                        </text>
                      )}
                    </g>
                  );
                })}
                
                {/* Arrow Markers */}
                <defs>
                  {['exploits', 'mitigates', 'affects', 'connects'].map(type => (
                    <marker
                      key={type}
                      id={`arrowhead-${type}`}
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill={getEdgeColor({ type } as ThreatEdge)}
                      />
                    </marker>
                  ))}
                </defs>
                
                {/* Nodes */}
                {nodes.map(node => {
                  const colors = getNodeColor(node);
                  const Icon = getNodeIcon(node);
                  const isSelected = selectedNode?.id === node.id;
                  
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={() => setSelectedNode(node)}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle
                        r={node.type === 'threat' ? 35 : 30}
                        fill={colors.bg}
                        stroke={isSelected ? '#fff' : colors.border}
                        strokeWidth={isSelected ? 3 : 2}
                        opacity={0.9}
                      />
                      <foreignObject
                        x="-25"
                        y="-25"
                        width="50"
                        height="50"
                        style={{ pointerEvents: 'none' }}
                      >
                        <div className="flex items-center justify-center h-full">
                          <Icon size={20} color={colors.text} />
                        </div>
                      </foreignObject>
                      <text
                        y={node.type === 'threat' ? 50 : 45}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="11"
                        fontWeight="500"
                      >
                        {node.label}
                      </text>
                      {node.severity && (
                        <circle
                          cx={20}
                          cy={-20}
                          r={8}
                          fill={node.severity === 'critical' ? '#DC2626' : node.severity === 'high' ? '#F97316' : '#EAB308'}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      )}
                      {node.status && node.type === 'asset' && (
                        <circle
                          cx={-20}
                          cy={-20}
                          r={8}
                          fill={node.status === 'mitigated' ? '#10B981' : node.status === 'partial' ? '#EAB308' : '#DC2626'}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Details Panel */}
          <div className="card">
            <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)]">
              <h2 className="font-semibold">Details</h2>
            </div>
            {selectedNode ? (
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: getNodeColor(selectedNode).bg }}
                  >
                    {React.createElement(getNodeIcon(selectedNode), { size: 24, color: getNodeColor(selectedNode).text })}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedNode.label}</h3>
                    <p className="text-sm text-[var(--color-text-muted)] capitalize">{selectedNode.type}</p>
                  </div>
                </div>
                
                {selectedNode.severity && (
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">Severity</p>
                    <span 
                      className="badge"
                      style={{
                        backgroundColor: selectedNode.severity === 'critical' ? '#DC262620' : selectedNode.severity === 'high' ? '#F9731620' : '#EAB30820',
                        color: selectedNode.severity === 'critical' ? '#DC2626' : selectedNode.severity === 'high' ? '#F97316' : '#EAB308',
                      }}
                    >
                      {selectedNode.severity}
                    </span>
                  </div>
                )}
                
                {selectedNode.status && (
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">Status</p>
                    <span 
                      className="badge"
                      style={{
                        backgroundColor: selectedNode.status === 'mitigated' ? '#10B98120' : selectedNode.status === 'partial' ? '#EAB30820' : '#DC262620',
                        color: selectedNode.status === 'mitigated' ? '#10B981' : selectedNode.status === 'partial' ? '#EAB308' : '#DC2626',
                      }}
                    >
                      {selectedNode.status}
                    </span>
                  </div>
                )}

                <div>
                  <p className="text-xs text-[var(--color-text-muted)] mb-2">Connections</p>
                  <div className="space-y-2">
                    {edges
                      .filter(e => e.from === selectedNode.id || e.to === selectedNode.id)
                      .map((edge, i) => {
                        const connectedId = edge.from === selectedNode.id ? edge.to : edge.from;
                        const connected = nodes.find(n => n.id === connectedId);
                        return connected ? (
                          <div key={i} className="flex items-center justify-between p-2 bg-[var(--color-bg-elevated)] rounded text-sm">
                            <span>{connected.label}</span>
                            <span className="text-xs text-[var(--color-text-muted)]">{edge.type}</span>
                          </div>
                        ) : null;
                      })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-[var(--color-text-muted)]">
                <Network size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select a node to view details</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Threats */}
          <div className="card">
            <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)]">
              <h2 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[var(--color-critical)]" />
                Threat Actors
              </h2>
            </div>
            <div className="divide-y divide-[var(--color-border-primary)]">
              {nodes.filter(n => n.type === 'threat').map(threat => (
                <div key={threat.id} className="p-4 hover:bg-[var(--color-bg-elevated)]/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[var(--color-critical-bg)] rounded-lg">
                        <AlertTriangle size={20} className="text-[var(--color-critical)]" />
                      </div>
                      <div>
                        <p className="font-medium">{threat.label}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Potential impact: High</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-[var(--color-text-muted)]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vulnerabilities */}
          <div className="card">
            <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)]">
              <h2 className="font-semibold flex items-center gap-2">
                <Lock className="w-5 h-5 text-[var(--color-high)]" />
                Vulnerabilities
              </h2>
            </div>
            <div className="divide-y divide-[var(--color-border-primary)]">
              {nodes.filter(n => n.type === 'vulnerability').map(vuln => (
                <div key={vuln.id} className="p-4 hover:bg-[var(--color-bg-elevated)]/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ 
                          backgroundColor: vuln.severity === 'critical' ? '#DC262620' : '#F9731620',
                        }}
                      >
                        <Lock 
                          size={20} 
                          className="text-[var(--color-high)]"
                          style={{ 
                            color: vuln.severity === 'critical' ? '#DC2626' : '#F97316',
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{vuln.label}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Status: {vuln.status}</p>
                      </div>
                    </div>
                    <span 
                      className="badge"
                      style={{
                        backgroundColor: vuln.severity === 'critical' ? '#DC262620' : '#F9731620',
                        color: vuln.severity === 'critical' ? '#DC2626' : '#F97316',
                      }}
                    >
                      {vuln.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="card">
            <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)]">
              <h2 className="font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-[var(--color-accent-blue)]" />
                Security Controls
              </h2>
            </div>
            <div className="divide-y divide-[var(--color-border-primary)]">
              {nodes.filter(n => n.type === 'control').map(control => (
                <div key={control.id} className="p-4 hover:bg-[var(--color-bg-elevated)]/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[var(--color-info-bg)] rounded-lg">
                        <Shield size={20} className="text-[var(--color-accent-blue)]" />
                      </div>
                      <div>
                        <p className="font-medium">{control.label}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Status: {control.status}</p>
                      </div>
                    </div>
                    <span 
                      className="badge"
                      style={{
                        backgroundColor: control.status === 'mitigated' ? '#10B98120' : '#EAB30820',
                        color: control.status === 'mitigated' ? '#10B981' : '#EAB308',
                      }}
                    >
                      {control.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assets */}
          <div className="card">
            <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)]">
              <h2 className="font-semibold flex items-center gap-2">
                <Server className="w-5 h-5 text-[var(--color-text-muted)]" />
                Assets
              </h2>
            </div>
            <div className="divide-y divide-[var(--color-border-primary)]">
              {nodes.filter(n => n.type === 'asset').map(asset => (
                <div key={asset.id} className="p-4 hover:bg-[var(--color-bg-elevated)]/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[var(--color-bg-elevated)] rounded-lg">
                        <Server size={20} className="text-[var(--color-text-muted)]" />
                      </div>
                      <div>
                        <p className="font-medium">{asset.label}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Risk: {asset.status}</p>
                      </div>
                    </div>
                    <span 
                      className="badge"
                      style={{
                        backgroundColor: asset.status === 'mitigated' ? '#10B98120' : asset.status === 'partial' ? '#EAB30820' : '#DC262620',
                        color: asset.status === 'mitigated' ? '#10B981' : asset.status === 'partial' ? '#EAB308' : '#DC2626',
                      }}
                    >
                      {asset.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add React import
import React from 'react';
