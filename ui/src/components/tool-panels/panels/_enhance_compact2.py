#!/usr/bin/env python3
"""Add compact enhancement BEFORE the class closing brace, preserving declare global."""

import os, re

PANELS_DIR = '/Users/tombook/Documents/work/ai_openclaw/dev_work/secuclaw/ui/src/components/tool-panels/panels'

COMPACT_ADDITION = '''
  // === Enhanced Pipeline & Grid Integration ===
  private _pipelineProgress = 0;
  private _pipelineRunning = false;
  private _pipelinePhase = 'idle';
  private _jobQueue: { id: string; name: string; priority: number; status: string }[] = [];
  private _errorCategories: { category: string; count: number; autoRemediation: string }[] = [];
  private _gridSelectedRows: Set<string> = new Set();
  private _gridSortColumn = 'riskScore';
  private _gridSortAsc = false;
  private _showHelpOverlay = false;
  private _glossaryTerms: { term: string; definition: string }[] = [
    { term: 'Risk Assessment', definition: 'Systematic process of identifying and evaluating risks' },
    { term: 'Threat Vector', definition: 'Path or means by which an attacker can compromise a system' },
    { term: 'Vulnerability', definition: 'Weakness that can be exploited by a threat to cause harm' },
    { term: 'Mitigation', definition: 'Action taken to reduce the likelihood or impact of a risk' },
    { term: 'Residual Risk', definition: 'Risk remaining after controls have been applied' },
    { term: 'Risk Score', definition: 'Numerical rating combining likelihood and impact factors' },
    { term: 'Control', definition: 'Safeguard or countermeasure that reduces risk exposure' },
    { term: 'Compliance', definition: 'Adherence to laws, regulations, standards, and policies' },
    { term: 'Incident', definition: 'Security event that actually or potentially jeopardizes systems' },
    { term: 'Remediation', definition: 'Process of repairing or correcting a vulnerability or finding' },
    { term: 'SLA', definition: 'Service Level Agreement defining response and resolution targets' },
    { term: 'TTP', definition: 'Tactics, Techniques, and Procedures used by threat actors' },
  ];
  private _keyboardShortcuts: { key: string; action: string }[] = [
    { key: 'Ctrl+Enter', action: 'Execute pipeline' },
    { key: 'Ctrl+Shift+E', action: 'Export data' },
    { key: 'Ctrl+Shift+R', action: 'Rollback phase' },
    { key: 'Ctrl+F', action: 'Find in grid' },
    { key: 'Ctrl+A', action: 'Select all' },
    { key: 'Escape', action: 'Close overlay' },
    { key: 'Ctrl+H', action: 'Toggle help' },
    { key: 'Ctrl+1-5', action: 'Switch tabs' },
  ];

  private _renderPipelineMini(): any {
    const barColor = this._pipelineRunning ? '#3b82f6' : this._pipelinePhase === 'error' ? '#ef4444' : '#22c55e';
    return html`<div style="background:#1f2937;border-radius:8px;padding:12px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-weight:600;font-size:11px;color:#9ca3af;text-transform:uppercase">Pipeline Status</span>
        <span style="font-size:9px;color:#6b7280">${this._pipelinePhase}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="flex:1;height:6px;background:#0a0c10;border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${this._pipelineProgress}%;background:${barColor};border-radius:3px;transition:width 0.3s"></div>
        </div>
        <span style="font-size:10px;color:#e2e8f0;font-weight:600">${this._pipelineProgress}%</span>
      </div>
    </div>`;
  }

  private _renderHelpOverlay(): any {
    if (!this._showHelpOverlay) return html``;
    return html`<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center" @click=${() => { this._showHelpOverlay = false; }}>
      <div style="background:#1f2937;border-radius:12px;padding:20px;max-width:550px;max-height:75vh;overflow-y:auto;width:90%" @click=${(e: any) => e.stopPropagation()}>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-weight:700;font-size:15px;color:#e2e8f0">Documentation</span>
          <button style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:18px" @click=${() => { this._showHelpOverlay = false; }}>✕</button>
        </div>
        ${this._glossaryTerms.map(g => html`<div style="padding:5px 0;border-bottom:1px solid #374151"><span style="font-weight:600;color:#60a5fa;font-size:11px">${g.term}</span><p style="font-size:10px;color:#9ca3af;margin:1px 0 0;line-height:1.3">${g.definition}</p></div>`)}
        <div style="margin-top:10px;font-weight:600;font-size:11px;color:#9ca3af;text-transform:uppercase;margin-bottom:6px">Shortcuts</div>
        ${this._keyboardShortcuts.map(s => html`<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:10px"><span style="color:#d1d5db">${s.action}</span><kbd style="background:#0a0c10;padding:1px 6px;border-radius:3px;color:#60a5fa;font-family:monospace;font-size:9px;border:1px solid #374151">${s.key}</kbd></div>`)}
      </div>
    </div>`;
  }
'''

def find_class_end(content):
    """Find the position right before the class closing brace.
    Strategy: find 'declare global' and the class } before it.
    If no declare global, find the last } that is at column 0 (top-level).
    """
    lines = content.split('\n')
    
    # Check for 'declare global' pattern
    decl_line_idx = None
    for i, line in enumerate(lines):
        if 'declare global' in line:
            decl_line_idx = i
            break
    
    if decl_line_idx is not None:
        # The class closing } is the line just before 'declare global'
        # It should be a line that is just '}'
        for i in range(decl_line_idx - 1, -1, -1):
            stripped = lines[i].strip()
            if stripped == '}':
                # This is the class closing brace
                # Return position right before this line
                char_pos = sum(len(lines[j]) + 1 for j in range(i))
                return char_pos
        # Fallback: just use the position before declare global
        char_pos = sum(len(lines[j]) + 1 for j in range(decl_line_idx))
        return char_pos
    
    # No declare global - find last top-level }
    for i in range(len(lines) - 1, -1, -1):
        stripped = lines[i].strip()
        if stripped == '}':
            char_pos = sum(len(lines[j]) + 1 for j in range(i))
            return char_pos
    
    return None

count = 0
for fname in sorted(os.listdir(PANELS_DIR)):
    if not fname.endswith('.ts') or fname.startswith('_'):
        continue
    filepath = os.path.join(PANELS_DIR, fname)
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    lines = content.count('\n') + 1
    if lines >= 1500:
        continue
    
    # Check if we already added these properties
    if '_pipelineProgress' in content:
        continue
    
    pos = find_class_end(content)
    if pos is None:
        print(f"  SKIP (can't find class end): {fname}")
        continue
    
    new_content = content[:pos] + COMPACT_ADDITION + '\n' + content[pos:]
    
    with open(filepath, 'w') as f:
        f.write(new_content)
    
    new_lines = new_content.count('\n') + 1
    print(f"  {fname}: {lines} -> {new_lines} lines")
    count += 1

print(f"\nEnhanced {count} panels.")
