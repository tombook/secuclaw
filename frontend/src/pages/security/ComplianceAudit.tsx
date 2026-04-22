import { useState } from 'react';
import { ClipboardCheck, Shield, CheckCircle, XCircle, AlertTriangle, Download, FileText, TrendingUp } from 'lucide-react';
import { mockComplianceFrameworks, getComplianceTrend } from '../../api/securityData';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function ComplianceAudit() {
  const [selectedFramework, setSelectedFramework] = useState('nist');
  const trend = getComplianceTrend();
  const currentFramework = mockComplianceFrameworks.find(f => f.id === selectedFramework) || mockComplianceFrameworks[0];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'var(--color-low)';
    if (score >= 70) return 'var(--color-medium)';
    return 'var(--color-critical)';
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-[var(--color-accent-blue)]" />
            Compliance & Audit
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">Monitor compliance posture and manage audits</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary"><Download size={16} /> Export</button>
          <button className="btn btn-primary"><FileText size={16} /> Start Audit</button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Compliance Trend</h2>
        <div className="h-64">
          <Line data={{
            labels: trend.labels,
            datasets: [
              { label: 'SOC 2', data: trend.soc2, borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true },
              { label: 'NIST CSF', data: trend.nist, borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true },
              { label: 'ISO 27001', data: trend.iso, borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.1)', fill: true },
            ],
          }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#9CA3AF' } } }, scales: { y: { min: 50, max: 100, grid: { color: 'rgba(107, 114, 128, 0.1)' }, ticks: { color: '#9CA3AF' } }, x: { grid: { display: false }, ticks: { color: '#9CA3AF' } } }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {mockComplianceFrameworks.map((fw) => (
          <button key={fw.id} onClick={() => setSelectedFramework(fw.id)} className={`card p-4 text-left transition-all ${selectedFramework === fw.id ? 'border-[var(--color-accent-blue)] ring-2 ring-[var(--color-accent-blue)]/30' : ''}`}>
            <Shield size={24} className="text-[var(--color-accent-blue)] mb-2" />
            <h3 className="font-semibold text-sm">{fw.name}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold" style={{ color: getScoreColor(fw.overallScore) }}>{fw.overallScore}</span>
              <span className="text-xs text-[var(--color-text-muted)]">%</span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">{currentFramework.name}</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Version {currentFramework.version}</p>
            </div>
            <TrendingUp size={16} className="text-[var(--color-low)]" />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-[var(--color-low-bg)] rounded-lg">
              <CheckCircle size={24} className="mx-auto text-[var(--color-low)] mb-2" />
              <p className="text-2xl font-bold text-[var(--color-low)]">{currentFramework.controlsPassed}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Passed</p>
            </div>
            <div className="text-center p-4 bg-[var(--color-critical-bg)] rounded-lg">
              <XCircle size={24} className="mx-auto text-[var(--color-critical)] mb-2" />
              <p className="text-2xl font-bold text-[var(--color-critical)]">{currentFramework.controlsFailed}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Failed</p>
            </div>
            <div className="text-center p-4 bg-[var(--color-bg-tertiary)] rounded-lg">
              <AlertTriangle size={24} className="mx-auto text-[var(--color-text-muted)] mb-2" />
              <p className="text-2xl font-bold text-[var(--color-text-muted)]">{currentFramework.controlsNotApplicable}</p>
              <p className="text-xs text-[var(--color-text-muted)]">N/A</p>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Overall Score</span>
              <span className="font-bold">{currentFramework.overallScore}%</span>
            </div>
            <div className="progress-bar h-3">
              <div className="progress-bar-fill" style={{ width: `${currentFramework.overallScore}%`, backgroundColor: getScoreColor(currentFramework.overallScore) }} />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Gap Analysis</h3>
          <div className="space-y-3">
            <div className="p-3 bg-[var(--color-critical-bg)] rounded-lg border border-[var(--color-critical)]/30">
              <p className="font-medium text-sm">Risk Assessment</p>
              <p className="text-xs text-[var(--color-text-muted)]">Control V1.2 - Failed</p>
            </div>
            <div className="p-3 bg-[var(--color-medium-bg)] rounded-lg border border-[var(--color-medium)]/30">
              <p className="font-medium text-sm">Information Communication</p>
              <p className="text-xs text-[var(--color-text-muted)]">Control CC2.1 - Needs Review</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
