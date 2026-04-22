import { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  ChevronDown,
  ChevronRight,
  User,
  MessageSquare,
  FileText,
  Shield,
  RefreshCw,
  Filter,
  Download,
  Search,
  Activity,
  Zap,
  Lock,
  Eye,
  Send,
} from 'lucide-react';
import {
  mockIncidents,
  mockAlerts,
  type Incident,
  type TimelineEvent,
} from '../../api/securityData';

export default function IncidentTimeline() {
  const [incidents] = useState<Incident[]>(mockIncidents);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(incidents[0]);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSeverity = filterSeverity === 'all' || inc.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || inc.status === filterStatus;
    return matchesSeverity && matchesStatus;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'var(--color-critical)';
      case 'high': return 'var(--color-high)';
      case 'medium': return 'var(--color-medium)';
      case 'low': return 'var(--color-low)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'var(--color-critical)';
      case 'investigating': return 'var(--color-high)';
      case 'contained': return 'var(--color-medium)';
      case 'resolved': return 'var(--color-low)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getEventIcon = (action: string) => {
    if (action.includes('Alert') || action.includes('Detection')) return AlertTriangle;
    if (action.includes('Contain') || action.includes('Isolat')) return Shield;
    if (action.includes('Resolv') || action.includes('Complet')) return CheckCircle;
    if (action.includes('Triage') || action.includes('Assess')) return Eye;
    if (action.includes('Analysis') || action.includes('Investigat')) return Search;
    return Activity;
  };

  const formatDuration = (start: Date, end: Date) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <Clock className="w-8 h-8 text-[var(--color-accent-blue)]" />
            Incident Timeline
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Visualize and track incident response progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <Download size={16} />
            Export
          </button>
          <button className="btn btn-primary">
            <RefreshCw size={16} />
            Sync
          </button>
        </div>
      </div>

      {/* Incident List & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident List */}
        <div className="card">
          <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)]">
            <h2 className="font-semibold mb-3">Incidents</h2>
            <div className="flex flex-col gap-2">
              <select
                className="select text-sm"
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                className="select text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="investigating">Investigating</option>
                <option value="contained">Contained</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
          <div className="divide-y divide-[var(--color-border-primary)] max-h-[600px] overflow-y-auto">
            {filteredIncidents.map((incident) => (
              <button
                key={incident.id}
                className={`w-full p-4 text-left hover:bg-[var(--color-bg-elevated)]/50 transition-colors ${
                  selectedIncident?.id === incident.id
                    ? 'bg-[var(--color-info-bg)] border-l-4 border-[var(--color-accent-blue)]'
                    : ''
                }`}
                onClick={() => setSelectedIncident(incident)}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: getSeverityColor(incident.severity) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{incident.title}</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      {incident.id}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="badge text-xs"
                        style={{
                          backgroundColor: `${getStatusColor(incident.status)}20`,
                          color: getStatusColor(incident.status),
                        }}
                      >
                        {incident.status}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {incident.timeline.length} events
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Timeline View */}
        <div className="lg:col-span-2 card">
          {selectedIncident ? (
            <>
              <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span
                        className="badge"
                        style={{
                          backgroundColor: `${getSeverityColor(selectedIncident.severity)}20`,
                          color: getSeverityColor(selectedIncident.severity),
                        }}
                      >
                        {selectedIncident.severity}
                      </span>
                      <h2 className="font-semibold">{selectedIncident.title}</h2>
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                      {selectedIncident.id} • Assigned to {selectedIncident.assignee}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[var(--color-accent-blue)]">
                      {formatDuration(selectedIncident.createdAt, selectedIncident.updatedAt)}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">Duration</p>
                  </div>
                </div>
              </div>

              {/* Incident Summary */}
              <div className="p-4 border-b border-[var(--color-border-primary)]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Source</p>
                    <p className="font-medium text-sm">{selectedIncident.source}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Created</p>
                    <p className="font-medium text-sm">
                      {new Date(selectedIncident.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Last Update</p>
                    <p className="font-medium text-sm">
                      {new Date(selectedIncident.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Affected Assets</p>
                    <p className="font-medium text-sm">
                      {selectedIncident.affectedAssets.join(', ')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Activity size={18} />
                  Response Timeline
                </h3>
                <div className="relative">
                  {/* Vertical Line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[var(--color-border-primary)]" />

                  <div className="space-y-4">
                    {selectedIncident.timeline.map((event, index) => {
                      const EventIcon = getEventIcon(event.action);
                      const isExpanded = expandedEvent === event.id;
                      const isLast = index === selectedIncident.timeline.length - 1;

                      return (
                        <div key={event.id} className="relative pl-10">
                          {/* Icon */}
                          <div
                            className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              isLast
                                ? 'bg-[var(--color-accent-blue)] text-white'
                                : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]'
                            }`}
                          >
                            <EventIcon size={16} />
                          </div>

                          {/* Content */}
                          <div
                            className={`p-4 rounded-lg transition-all ${
                              isLast
                                ? 'bg-[var(--color-info-bg)] border border-[var(--color-accent-blue)]/30'
                                : 'bg-[var(--color-bg-elevated)]'
                            }`}
                          >
                            <button
                              className="w-full flex items-center justify-between"
                              onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                            >
                              <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{event.action}</span>
                                </div>
                                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                  by {event.user} • {new Date(event.timestamp).toLocaleString()}
                                </p>
                              </div>
                              {isExpanded ? (
                                <ChevronDown size={18} />
                              ) : (
                                <ChevronRight size={18} />
                              )}
                            </button>

                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-[var(--color-border-primary)] animate-fade-in">
                                <p className="text-sm">{event.details}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Add Note */}
              <div className="p-4 border-t border-[var(--color-border-primary)]">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Add a timeline note..."
                    className="input flex-1"
                  />
                  <button className="btn btn-primary">
                    <Send size={16} />
                    Add
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-96">
              <p className="text-[var(--color-text-muted)]">Select an incident to view timeline</p>
            </div>
          )}
        </div>
      </div>

      {/* Incident Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-critical-bg)] rounded-lg">
              <AlertTriangle size={20} className="text-[var(--color-critical)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{incidents.filter(i => i.severity === 'critical').length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Critical Incidents</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-info-bg)] rounded-lg">
              <Clock size={20} className="text-[var(--color-accent-blue)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {incidents.filter(i => i.status === 'investigating').length}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">Under Investigation</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-low-bg)] rounded-lg">
              <CheckCircle size={20} className="text-[var(--color-low)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {incidents.filter(i => i.status === 'resolved').length}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">Resolved Today</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--color-medium-bg)] rounded-lg">
              <Activity size={20} className="text-[var(--color-medium)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">4.2h</p>
              <p className="text-xs text-[var(--color-text-muted)]">Avg Resolution</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
