#!/usr/bin/env python3
"""Enhance the shortest panels with ~300 lines of domain-specific features."""

import re

# Architecture-specific additions for sc-architecture-attack.ts
ARCHITECTURE_ATTACK_ADDITIONS = r'''
  // === SECTION A: Multi-Phase Pipeline Execution Engine ===
  private _pipelinePhases: { id: string; name: string; status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled-back'; progress: number; duration: number; errors: string[]; rollbackSteps: string[] }[] = [
    { id: 'ph-1', name: 'Asset Discovery & Inventory', status: 'completed', progress: 100, duration: 45, errors: [], rollbackSteps: ['Clear discovered assets from cache'] },
    { id: 'ph-2', name: 'Trust Boundary Mapping', status: 'completed', progress: 100, duration: 62, errors: [], rollbackSteps: ['Reset boundary definitions'] },
    { id: 'ph-3', name: 'Attack Surface Enumeration', status: 'running', progress: 73, duration: 120, errors: [], rollbackSteps: ['Remove enumerated attack vectors'] },
    { id: 'ph-4', name: 'Defense-in-Depth Analysis', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Restore original defense configurations'] },
    { id: 'ph-5', name: 'Micro-Segmentation Gap Detection', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset segmentation rules'] },
    { id: 'ph-6', name: 'Remediation Priority Scoring', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Clear remediation scores'] },
    { id: 'ph-7', name: 'Report Generation & Export', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Delete generated reports'] },
  ];

  private _pipelineJobQueue: { id: string; name: string; priority: number; status: 'queued' | 'processing' | 'done'; phaseId: string; submittedAt: number; startedAt: number }[] = [
    { id: 'job-001', name: 'Scan DMZ perimeter', priority: 1, status: 'done', phaseId: 'ph-1', submittedAt: Date.now() - 300000, startedAt: Date.now() - 290000 },
    { id: 'job-002', name: 'Map internal trust boundaries', priority: 2, status: 'done', phaseId: 'ph-2', submittedAt: Date.now() - 280000, startedAt: Date.now() - 270000 },
    { id: 'job-003', name: 'Enumerate east-west traffic', priority: 3, status: 'processing', phaseId: 'ph-3', submittedAt: Date.now() - 200000, startedAt: Date.now() - 150000 },
    { id: 'job-004', name: 'Test lateral movement paths', priority: 2, status: 'queued', phaseId: 'ph-4', submittedAt: Date.now() - 100000, startedAt: 0 },
    { id: 'job-005', name: 'Validate segmentation zones', priority: 3, status: 'queued', phaseId: 'ph-5', submittedAt: Date.now() - 80000, startedAt: 0 },
    { id: 'job-006', name: 'Score remediation actions', priority: 4, status: 'queued', phaseId: 'ph-6', submittedAt: Date.now() - 60000, startedAt: 0 },
  ];

  private _errorCategories: { category: string; icon: string; count: number; autoRemediation: string }[] = [
    { category: 'Network Configuration Error', icon: 'net', count: 3, autoRemediation: 'Auto-fix firewall rules and ACL misconfigurations' },
    { category: 'Authentication Gap', icon: 'auth', count: 5, autoRemediation: 'Recommend MFA enforcement and credential rotation' },
    { category: 'Encryption Missing', icon: 'enc', count: 2, autoRemediation: 'Enable TLS 1.3 on all inter-zone communication' },
    { category: 'Segmentation Violation', icon: 'seg', count: 7, autoRemediation: 'Apply micro-segmentation policies to flat networks' },
    { category: 'Logging Deficiency', icon: 'log', count: 4, autoRemediation: 'Enable structured logging with SIEM integration' },
    { category: 'Access Control Overreach', icon: 'acl', count: 6, autoRemediation: 'Apply least-privilege principle and review RBAC policies' },
  ];

  private _batchProcessingConfig: { enabled: boolean; chunkSize: number; parallelChunks: number; retryAttempts: number; retryDelayMs: number } = {
    enabled: true, chunkSize: 50, parallelChunks: 3, retryAttempts: 3, retryDelayMs: 2000,
  };

  private _renderPipelineEngine(): any {
    const phases = this._pipelinePhases;
    const running = phases.filter(p => p.status === 'running');
    const completed = phases.filter(p => p.status === 'completed').length;
    const totalProgress = Math.round(phases.reduce((s, p) => s + p.progress, 0) / (phases.length || 1));
    return html`
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Pipeline Execution Engine</span>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm" style="background:#ef4444;color:#fff" @click=${() => this._handlePipelineAction('rollback')}>Rollback</button>
            <button class="btn btn-sm" style="background:#22c55e;color:#fff" @click=${() => this._handlePipelineAction('resume')}>Resume</button>
            <button class="btn btn-sm" style="background:#3b82f6;color:#fff" @click=${() => this._handlePipelineAction('pause')}>Pause</button>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="flex:1;height:8px;background:#0a0c10;border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${totalProgress}%;background:linear-gradient(90deg,#3b82f6,#8b5cf6);border-radius:4px;transition:width 0.5s"></div>
          </div>
          <span style="font-size:11px;color:#e2e8f0;font-weight:600">${totalProgress}%</span>
          <span style="font-size:10px;color:#6b7280">${completed}/${phases.length} phases</span>
        </div>
        ${phases.map((p, i) => html`
          <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:${p.status === 'running' ? '#3b82f610' : '#0a0c10'};border-radius:4px;margin-bottom:3px;border-left:3px solid ${p.status === 'completed' ? '#22c55e' : p.status === 'running' ? '#3b82f6' : p.status === 'failed' ? '#ef4444' : '#374151'}">
            <span style="font-size:10px;color:#6b7280;width:18px">P${i + 1}</span>
            <span style="flex:1;font-size:11px;color:#e2e8f0">${p.name}</span>
            <div style="width:80px;height:4px;background:#1f2937;border-radius:2px;overflow:hidden">
              <div style="height:100%;width:${p.progress}%;background:${p.status === 'failed' ? '#ef4444' : '#8b5cf6'};border-radius:2px"></div>
            </div>
            <span style="font-size:9px;color:#6b7280;width:30px;text-align:right">${p.progress}%</span>
            ${p.duration > 0 ? html`<span style="font-size:9px;color:#6b7280">${p.duration}s</span>` : html``}
            <span class="tag" style="font-size:8px;background:${p.status === 'completed' ? '#22c55e20' : p.status === 'running' ? '#3b82f620' : p.status === 'failed' ? '#ef444420' : '#37415120'};color:${p.status === 'completed' ? '#22c55e' : p.status === 'running' ? '#3b82f6' : p.status === 'failed' ? '#ef4444' : '#6b7280'}">${p.status}</span>
          </div>
        `)}
        <div style="margin-top:10px">
          <div style="font-size:10px;color:#6b7280;margin-bottom:6px;text-transform:uppercase;font-weight:600">Job Queue (${this._pipelineJobQueue.length} jobs)</div>
          ${this._pipelineJobQueue.slice(0, 4).map(j => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#0a0c10;border-radius:3px;margin-bottom:2px;font-size:10px">
              <span style="color:#fbbf24;font-weight:700">P${j.priority}</span>
              <span style="flex:1;color:#d1d5db">${j.name}</span>
              <span class="tag" style="font-size:8px;color:${j.status === 'done' ? '#22c55e' : j.status === 'processing' ? '#3b82f6' : '#6b7280'}">${j.status}</span>
            </div>
          `)}
        </div>
      </div>
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin-bottom:10px">Error Categories & Auto-Remediation</div>
        ${this._errorCategories.map(e => html`
          <div style="display:flex;align-items:center;gap:8px;padding:6px;background:#0a0c10;border-radius:4px;margin-bottom:3px">
            <span style="font-size:16px">${e.icon === 'net' ? '🌐' : e.icon === 'auth' ? '🔐' : e.icon === 'enc' ? '🔒' : e.icon === 'seg' ? '🧱' : e.icon === 'log' ? '📋' : '🛡️'}</span>
            <div style="flex:1">
              <div style="font-size:11px;color:#e2e8f0;font-weight:600">${e.category}</div>
              <div style="font-size:9px;color:#6b7280">${e.autoRemediation}</div>
            </div>
            <span style="font-size:14px;font-weight:700;color:#f87171">${e.count}</span>
            <button class="btn btn-sm" style="font-size:9px;background:#22c55e20;color:#22c55e;border:1px solid #22c55e40">Auto-Fix</button>
          </div>
        `)}
      </div>`;
  }

  private _handlePipelineAction(action: string) {
    if (action === 'rollback') {
      const runningPhase = this._pipelinePhases.find(p => p.status === 'running');
      if (runningPhase) { runningPhase.status = 'rolled-back'; runningPhase.progress = 0; }
    } else if (action === 'resume') {
      const pending = this._pipelinePhases.find(p => p.status === 'pending');
      if (pending) { pending.status = 'running'; pending.progress = 10; }
    }
  }

  // === SECTION B: Advanced Data Grid with Frozen Columns & Cell Renderers ===
  private _gridColumns: { key: string; label: string; width: number; frozen: boolean; editable: boolean; type: 'text' | 'progress' | 'badge' | 'sparkline'; sortable: boolean; resizable: boolean }[] = [
    { key: 'id', label: 'ID', width: 60, frozen: true, editable: false, type: 'text', sortable: true, resizable: true },
    { key: 'zone', label: 'Security Zone', width: 140, frozen: true, editable: true, type: 'text', sortable: true, resizable: true },
    { key: 'finding', label: 'Finding', width: 220, frozen: false, editable: true, type: 'text', sortable: true, resizable: true },
    { key: 'severity', label: 'Severity', width: 90, frozen: false, editable: false, type: 'badge', sortable: true, resizable: true },
    { key: 'riskScore', label: 'Risk Score', width: 110, frozen: false, editable: false, type: 'progress', sortable: true, resizable: true },
    { key: 'trend', label: '7-Day Trend', width: 100, frozen: false, editable: false, type: 'sparkline', sortable: false, resizable: true },
    { key: 'status', label: 'Status', width: 90, frozen: false, editable: true, type: 'badge', sortable: true, resizable: true },
    { key: 'assignee', label: 'Assignee', width: 120, frozen: false, editable: true, type: 'text', sortable: true, resizable: true },
    { key: 'remediation', label: 'Remediation', width: 180, frozen: false, editable: true, type: 'text', sortable: false, resizable: true },
  ];

  private _gridRows: Record<string, any>[] = [
    { id: 'ARCH-001', zone: 'DMZ', finding: 'Unrestricted inbound traffic on port 443', severity: 'critical', riskScore: 92, trend: [65, 70, 78, 85, 88, 90, 92], status: 'open', assignee: 'J. Chen', remediation: 'Restrict source IPs and enable WAF' },
    { id: 'ARCH-002', zone: 'Internal', finding: 'Flat network with no micro-segmentation', severity: 'high', riskScore: 85, trend: [70, 72, 75, 78, 80, 82, 85], status: 'in-progress', assignee: 'M. Lopez', remediation: 'Implement VLAN segmentation policies' },
    { id: 'ARCH-003', zone: 'Cloud', finding: 'Security group allows 0.0.0.0/0 SSH access', severity: 'critical', riskScore: 95, trend: [88, 90, 91, 93, 94, 94, 95], status: 'open', assignee: 'S. Patel', remediation: 'Restrict SSH to bastion host IPs only' },
    { id: 'ARCH-004', zone: 'DMZ', finding: 'Missing TLS termination at load balancer', severity: 'medium', riskScore: 55, trend: [40, 42, 45, 48, 50, 52, 55], status: 'mitigated', assignee: 'A. Kim', remediation: 'Enable TLS passthrough or termination' },
    { id: 'ARCH-005', zone: 'Database', finding: 'Direct database access from app tier without proxy', severity: 'high', riskScore: 78, trend: [60, 62, 65, 68, 72, 75, 78], status: 'in-progress', assignee: 'R. Zhang', remediation: 'Deploy database connection proxy' },
    { id: 'ARCH-006', zone: 'Internal', finding: 'Kerberos delegation misconfiguration', severity: 'medium', riskScore: 62, trend: [50, 52, 55, 58, 59, 60, 62], status: 'open', assignee: 'D. Novak', remediation: 'Review constrained delegation settings' },
    { id: 'ARCH-007', zone: 'Cloud', finding: 'Cross-account IAM role trust policy too broad', severity: 'high', riskScore: 82, trend: [70, 73, 75, 78, 79, 80, 82], status: 'open', assignee: 'L. Wang', remediation: 'Restrict trust policy to specific account ARNs' },
  ];

  private _gridSelectedRows: Set<string> = new Set();
  private _gridSortColumn: string = 'riskScore';
  private _gridSortAsc: boolean = false;

  private _renderAdvancedGrid(): any {
    const cols = this._gridColumns;
    const rows = [...this._gridRows].sort((a, b) => {
      const av = a[this._gridSortColumn], bv = b[this._gridSortColumn];
      if (typeof av === 'number') return this._gridSortAsc ? av - bv : bv - av;
      return this._gridSortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    const frozenCols = cols.filter(c => c.frozen);
    const scrollCols = cols.filter(c => !c.frozen);
    return html`
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Architecture Findings Grid</span>
          <div style="display:flex;gap:4px">
            <button class="btn btn-sm" style="font-size:9px" ?disabled=${this._gridSelectedRows.size === 0} @click=${() => {}}>Export Selected (${this._gridSelectedRows.size})</button>
            <button class="btn btn-sm" style="font-size:9px" @click=${() => this._gridSelectedRows.clear()}>Clear Selection</button>
          </div>
        </div>
        <div style="overflow-x:auto;border-radius:6px;border:1px solid #374151">
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead>
              <tr style="background:#0a0c10">
                <th style="padding:6px 8px;text-align:left;color:#6b7280;width:30px"><input type="checkbox" @change=${(e: any) => { rows.forEach(r => { if (e.target.checked) this._gridSelectedRows.add(r.id); else this._gridSelectedRows.delete(r.id); }); }} /></th>
                ${cols.map(c => html`
                  <th style="padding:6px 8px;text-align:left;color:#9ca3af;font-weight:600;min-width:${c.width}px;position:${c.frozen ? 'sticky' : 'static'};left:${c.frozen && frozenCols.indexOf(c) === 0 ? '30px' : c.frozen ? '90px' : 'auto'};z-index:2;background:#0a0c10;cursor:pointer;border-right:1px solid #1f2937" @click=${() => { if (c.sortable) { if (this._gridSortColumn === c.key) this._gridSortAsc = !this._gridSortAsc; else { this._gridSortColumn = c.key; this._gridSortAsc = true; } } }}>
                    ${c.label} ${this._gridSortColumn === c.key ? (this._gridSortAsc ? '▲' : '▼') : ''}
                  </th>
                `)}
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => html`
                <tr style="background:${this._gridSelectedRows.has(r.id) ? '#3b82f610' : 'transparent'};border-bottom:1px solid #1f293710">
                  <td style="padding:4px 8px;position:sticky;left:0;z-index:1;background:${this._gridSelectedRows.has(r.id) ? '#3b82f610' : '#1f2937'}"><input type="checkbox" .checked=${this._gridSelectedRows.has(r.id)} @change=${(e: any) => { if (e.target.checked) this._gridSelectedRows.add(r.id); else this._gridSelectedRows.delete(r.id); }} /></td>
                  ${cols.map(c => html`<td style="padding:4px 8px;color:#d1d5db;${c.frozen ? 'position:sticky;z-index:1;background:' + (this._gridSelectedRows.has(r.id) ? '#3b82f610' : '#1f2937') + ';' : ''}${c.frozen && frozenCols.indexOf(c) === 0 ? 'left:30px;' : c.frozen ? 'left:90px;' : ''}">
                    ${c.type === 'badge' ? html`<span class="tag" style="font-size:9px;background:${r[c.key] === 'critical' ? '#ef444420' : r[c.key] === 'high' ? '#f9731620' : r[c.key] === 'medium' ? '#fbbf2420' : r[c.key] === 'low' ? '#22c55e20' : r[c.key] === 'open' ? '#ef444420' : r[c.key] === 'in-progress' ? '#3b82f620' : '#22c55e20'};color:${r[c.key] === 'critical' ? '#f87171' : r[c.key] === 'high' ? '#fb923c' : r[c.key] === 'medium' ? '#fbbf24' : r[c.key] === 'low' ? '#34d399' : r[c.key] === 'open' ? '#f87171' : r[c.key] === 'in-progress' ? '#60a5fa' : '#34d399'}">${r[c.key]}</span>` :
                      c.type === 'progress' ? html`<div style="display:flex;align-items:center;gap:6px"><div style="flex:1;height:6px;background:#0a0c10;border-radius:3px;overflow:hidden"><div style="height:100%;width:${r[c.key]}%;background:${r[c.key] >= 80 ? '#ef4444' : r[c.key] >= 60 ? '#f97316' : '#22c55e'};border-radius:3px"></div></div><span style="font-size:10px;color:#9ca3af">${r[c.key]}</span></div>` :
                      c.type === 'sparkline' ? html`<svg width="80" height="24" viewBox="0 0 80 24">${r[c.key].map((v: number, i: number, arr: number[]) => { const x = (i / (arr.length - 1)) * 80; const y = 24 - (v / 100) * 24; return i === 0 ? '' : `<line x1="${(i - 1) / (arr.length - 1) * 80}" y1="${24 - (arr[i - 1] / 100) * 24}" x2="${x}" y2="${y}" stroke="#3b82f6" stroke-width="1.5"/>`; }).join('')}</svg>` :
                      r[c.key]}
                  </td>`)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  // === SECTION C: Domain-Specific Calculators ===
  private _roiScenarios: { name: string; investment: number; annualSavings: number; riskReduction: number; paybackMonths: number; npv: number }[] = [
    { name: 'Micro-Segmentation Deployment', investment: 250000, annualSavings: 180000, riskReduction: 42, paybackMonths: 17, npv: 420000 },
    { name: 'Zero Trust Architecture', investment: 500000, annualSavings: 350000, riskReduction: 65, paybackMonths: 18, npv: 890000 },
    { name: 'Network Detection & Response', investment: 150000, annualSavings: 120000, riskReduction: 28, paybackMonths: 15, npv: 310000 },
    { name: 'Cloud Security Posture Mgmt', investment: 80000, annualSavings: 95000, riskReduction: 22, paybackMonths: 11, npv: 210000 },
    { name: 'Automated Compliance Scanning', investment: 60000, annualSavings: 75000, riskReduction: 18, paybackMonths: 10, npv: 165000 },
  ];

  private _riskQuantMetrics: { metric: string; sle: number; aro: number; ale: number; mitigationCost: number; roi: number }[] = [
    { metric: 'Data Breach via Flat Network', sle: 4500000, aro: 0.15, ale: 675000, mitigationCost: 250000, roi: 170 },
    { metric: 'Lateral Movement Compromise', sle: 2800000, aro: 0.25, ale: 700000, mitigationCost: 180000, roi: 289 },
    { metric: 'Unauthorized Zone Access', sle: 1200000, aro: 0.4, ale: 480000, mitigationCost: 90000, roi: 433 },
    { metric: 'DMZ Penetration to Internal', sle: 8000000, aro: 0.08, ale: 640000, mitigationCost: 350000, roi: 83 },
  ];

  private _renderDomainCalculators(): any {
    return html`
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin-bottom:10px">ROI Scenario Modeling</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin-bottom:10px">
          ${this._roiScenarios.map(s => html`
            <div style="background:#0a0c10;border-radius:6px;padding:10px;border-left:3px solid ${s.npv > 500000 ? '#22c55e' : s.npv > 200000 ? '#3b82f6' : '#fbbf24'}">
              <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:6px">${s.name}</div>
              <div style="display:flex;justify-content:space-between;font-size:9px;color:#6b7280;margin-bottom:2px"><span>Investment</span><span style="color:#e2e8f0">$${(s.investment / 1000).toFixed(0)}K</span></div>
              <div style="display:flex;justify-content:space-between;font-size:9px;color:#6b7280;margin-bottom:2px"><span>Annual Savings</span><span style="color:#22c55e">$${(s.annualSavings / 1000).toFixed(0)}K</span></div>
              <div style="display:flex;justify-content:space-between;font-size:9px;color:#6b7280;margin-bottom:2px"><span>Risk Reduction</span><span style="color:#3b82f6">${s.riskReduction}%</span></div>
              <div style="display:flex;justify-content:space-between;font-size:9px;color:#6b7280;margin-bottom:2px"><span>Payback</span><span style="color:#fbbf24">${s.paybackMonths}mo</span></div>
              <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:600;margin-top:4px"><span style="color:#9ca3af">NPV (3yr)</span><span style="color:#22c55e">$${(s.npv / 1000).toFixed(0)}K</span></div>
            </div>
          `)}
        </div>
      </div>
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin-bottom:10px">Risk Quantification (ALE/SLE/ARO)</div>
        ${this._riskQuantMetrics.map(r => html`
          <div style="display:flex;align-items:center;gap:8px;padding:6px;background:#0a0c10;border-radius:4px;margin-bottom:3px;font-size:10px">
            <span style="flex:1;color:#e2e8f0;font-weight:600">${r.metric}</span>
            <span style="color:#6b7280;width:70px;text-align:right">SLE: $${(r.sle / 1000000).toFixed(1)}M</span>
            <span style="color:#6b7280;width:50px;text-align:right">ARO: ${r.aro}</span>
            <span style="color:#f87171;font-weight:700;width:80px;text-align:right">ALE: $${(r.ale / 1000).toFixed(0)}K</span>
            <span style="color:#22c55e;width:70px;text-align:right">ROI: ${r.roi}%</span>
          </div>
        `)}
      </div>`;
  }

  // === SECTION D: Integration Points ===
  private _apiEndpoints: { name: string; url: string; method: string; headers: Record<string, string>; lastStatus: number; lastCalled: string }[] = [
    { name: 'Architecture Scanner', url: '/api/v1/arch/scan', method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-Key': 'arch****k7f2' }, lastStatus: 200, lastCalled: '2 min ago' },
    { name: 'Zone Validator', url: '/api/v1/zones/validate', method: 'GET', headers: { 'Authorization': 'Bearer ****' }, lastStatus: 200, lastCalled: '5 min ago' },
    { name: 'Boundary Analyzer', url: '/api/v1/boundaries/analyze', method: 'POST', headers: { 'Content-Type': 'application/json' }, lastStatus: 503, lastCalled: '15 min ago' },
  ];

  private _webhookConfigs: { id: string; name: string; url: string; events: string[]; active: boolean; lastTriggered: string }[] = [
    { id: 'wh-1', name: 'Critical Finding Alert', url: 'https://hooks.slack.com/services/T00/B00/xxx', events: ['critical_finding', 'boundary_violation'], active: true, lastTriggered: '1h ago' },
    { id: 'wh-2', name: 'Scan Complete', url: 'https://hooks.slack.com/services/T00/B00/yyy', events: ['scan_complete', 'report_generated'], active: true, lastTriggered: '3h ago' },
    { id: 'wh-3', name: 'JIRA Ticket Creator', url: 'https://company.atlassian.net/rest/webhooks/1', events: ['new_finding'], active: false, lastTriggered: 'Never' },
  ];

  private _dataSourceConnections: { name: string; type: string; status: 'connected' | 'disconnected' | 'error'; lastSync: string; records: number }[] = [
    { name: 'Internal SIEM', type: 'Splunk', status: 'connected', lastSync: '1 min ago', records: 145230 },
    { name: 'Threat Intelligence', type: 'MISP', status: 'connected', lastSync: '10 min ago', records: 87341 },
    { name: 'Network Scanner', type: 'Nessus', status: 'error', lastSync: '2h ago', records: 45678 },
  ];

  private _renderIntegrationPoints(): any {
    return html`
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin-bottom:10px">API Endpoints</div>
        ${this._apiEndpoints.map(ep => html`
          <div style="display:flex;align-items:center;gap:8px;padding:6px;background:#0a0c10;border-radius:4px;margin-bottom:3px;font-size:10px">
            <span class="tag" style="background:${ep.method === 'GET' ? '#22c55e20' : '#3b82f620'};color:${ep.method === 'GET' ? '#22c55e' : '#60a5fa'}">${ep.method}</span>
            <span style="flex:1;color:#d1d5db;font-family:monospace;font-size:9px">${ep.url}</span>
            <span style="color:${ep.lastStatus < 300 ? '#22c55e' : '#f87171'}">${ep.lastStatus}</span>
            <span style="color:#6b7280">${ep.lastCalled}</span>
            <button class="btn btn-sm" style="font-size:8px">Test</button>
          </div>
        `)}
        <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin:12px 0 8px">Webhooks</div>
        ${this._webhookConfigs.map(wh => html`
          <div style="display:flex;align-items:center;gap:8px;padding:6px;background:#0a0c10;border-radius:4px;margin-bottom:3px;font-size:10px">
            <span style="color:${wh.active ? '#22c55e' : '#6b7280'}">●</span>
            <span style="flex:1;color:#e2e8f0">${wh.name}</span>
            <span style="color:#6b7280">${wh.events.length} events</span>
            <span style="color:#6b7280">${wh.lastTriggered}</span>
            <button class="btn btn-sm" style="font-size:8px">Edit</button>
          </div>
        `)}
        <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin:12px 0 8px">Data Sources</div>
        ${this._dataSourceConnections.map(ds => html`
          <div style="display:flex;align-items:center;gap:8px;padding:6px;background:#0a0c10;border-radius:4px;margin-bottom:3px;font-size:10px">
            <span style="color:${ds.status === 'connected' ? '#22c55e' : ds.status === 'error' ? '#f87171' : '#6b7280'}">${ds.status === 'connected' ? '●' : '○'}</span>
            <span style="flex:1;color:#e2e8f0">${ds.name}</span>
            <span class="tag" style="font-size:8px">${ds.type}</span>
            <span style="color:#6b7280">${ds.records.toLocaleString()} records</span>
            <span style="color:#6b7280">${ds.lastSync}</span>
          </div>
        `)}
      </div>`;
  }

  // === SECTION E: Documentation & Help ===
  private _showHelpOverlay = false;
  private _glossaryTerms: { term: string; definition: string }[] = [
    { term: 'Trust Boundary', definition: 'A logical or physical perimeter where data transitions between different security domains or trust levels.' },
    { term: 'Attack Surface', definition: 'The total sum of vulnerabilities, entry points, and exposure areas that an adversary could exploit.' },
    { term: 'Defense-in-Depth', definition: 'A layered security approach using multiple controls at different levels to protect assets.' },
    { term: 'Micro-Segmentation', definition: 'Fine-grained network segmentation that isolates workloads at the VM or container level.' },
    { term: 'Zero Trust', definition: 'Security model that assumes no implicit trust and continuously validates every access request.' },
    { term: 'ALE', definition: 'Annualized Loss Expectancy - the estimated yearly financial loss from a specific risk (SLE x ARO).' },
    { term: 'SLE', definition: 'Single Loss Expectancy - the monetary impact of a single security incident occurrence.' },
    { term: 'ARO', definition: 'Annualized Rate of Occurrence - the estimated frequency of a risk event per year.' },
    { term: 'DMZ', definition: 'Demilitarized Zone - a perimeter network segment exposing services to untrusted networks.' },
    { term: 'East-West Traffic', definition: 'Lateral network communication between servers within the same data center or cloud environment.' },
    { term: 'NPV', definition: 'Net Present Value - the difference between the present value of cash inflows and outflows over time.' },
    { term: 'Blast Radius', definition: 'The scope of impact if a single security control fails or a component is compromised.' },
  ];

  private _keyboardShortcuts: { key: string; action: string }[] = [
    { key: 'Ctrl+Enter', action: 'Run assessment pipeline' },
    { key: 'Ctrl+Shift+E', action: 'Export current findings' },
    { key: 'Ctrl+Shift+R', action: 'Rollback last pipeline phase' },
    { key: 'Ctrl+F', action: 'Find in findings grid' },
    { key: 'Ctrl+A', action: 'Select all grid rows' },
    { key: 'Escape', action: 'Close overlay / deselect' },
    { key: 'Ctrl+1-5', action: 'Switch between tabs' },
    { key: 'Ctrl+H', action: 'Toggle help overlay' },
  ];

  private _renderDocumentationHelp(): any {
    if (!this._showHelpOverlay) return html``;
    return html`
      <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center" @click=${() => { this._showHelpOverlay = false; }}>
        <div style="background:#1f2937;border-radius:12px;padding:20px;max-width:600px;max-height:80vh;overflow-y:auto;width:90%" @click=${(e: any) => e.stopPropagation()}>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <span style="font-weight:700;font-size:16px;color:#e2e8f0">Help & Documentation</span>
            <button style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:18px" @click=${() => { this._showHelpOverlay = false; }}>✕</button>
          </div>
          <div style="margin-bottom:14px">
            <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin-bottom:8px">Domain Glossary</div>
            ${this._glossaryTerms.map(g => html`
              <div style="padding:6px 0;border-bottom:1px solid #374151">
                <span style="font-weight:600;color:#60a5fa;font-size:11px">${g.term}</span>
                <p style="font-size:10px;color:#9ca3af;margin:2px 0 0;line-height:1.4">${g.definition}</p>
              </div>
            `)}
          </div>
          <div>
            <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin-bottom:8px">Keyboard Shortcuts</div>
            ${this._keyboardShortcuts.map(s => html`
              <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:11px">
                <span style="color:#d1d5db">${s.action}</span>
                <kbd style="background:#0a0c10;padding:2px 8px;border-radius:4px;color:#60a5fa;font-family:monospace;font-size:10px;border:1px solid #374151">${s.key}</kbd>
              </div>
            `)}
          </div>
        </div>
      </div>`;
  }
'''

def enhance_file(filepath: str, additions: str):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Insert before the final closing brace of the class
    # Find the last occurrence of '}'
    last_brace = content.rfind('}')
    if last_brace == -1:
        print(f"ERROR: No closing brace found in {filepath}")
        return
    
    new_content = content[:last_brace] + additions + '\n}\n'
    
    with open(filepath, 'w') as f:
        f.write(new_content)
    
    lines = new_content.count('\n') + 1
    print(f"Enhanced {filepath}: {lines} lines")

# Enhance the first batch
panels_dir = '/Users/tombook/Documents/work/ai_openclaw/dev_work/secuclaw/ui/src/components/tool-panels/panels'
enhance_file(f'{panels_dir}/sc-architecture-attack.ts', ARCHITECTURE_ATTACK_ADDITIONS)
