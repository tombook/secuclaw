#!/usr/bin/env python3
"""Fix: Revert the compact additions that were inserted in wrong location and re-insert correctly."""

import os, re

PANELS_DIR = '/Users/tombook/Documents/work/ai_openclaw/dev_work/secuclaw/ui/src/components/tool-panels/panels'

# The text that was wrongly inserted
MARKER = "  // === Enhanced Pipeline & Grid Integration ==="

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

fixed = 0
for fname in sorted(os.listdir(PANELS_DIR)):
    if not fname.endswith('.ts') or fname.startswith('_'):
        continue
    filepath = os.path.join(PANELS_DIR, fname)
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    if MARKER not in content:
        continue
    
    # Remove the wrongly inserted content (from MARKER to the last }\n)
    # The content was: ...MARKER...content...\n}\n
    marker_pos = content.find(MARKER)
    if marker_pos == -1:
        continue
    
    # Find where the wrongly added content ends - it ends with }\n
    # But we need to be careful. The wrongly added \n}\n is at the very end
    # The original file ended with: }  (class close)\n declare global {...}\n  or just }
    # Our addition was inserted before the LAST }
    
    # Strategy: remove from MARKER to end, then re-add the original ending
    # Find the original ending - it should be after the last method of the class
    
    # The class body ends before 'declare global' if it exists, or at the class closing }
    # Let's find the pattern: the class ends, then optionally 'declare global { ... }'
    
    # Remove everything from MARKER onwards
    before_marker = content[:marker_pos].rstrip()
    
    # The original ending should have been preserved in the original 1464-line file
    # Original ending pattern: \n}\n  or \n}\ndeclare global...\n}\n
    
    # Find if there's a 'declare global' in what we removed
    removed_part = content[marker_pos:]
    
    # Check if 'declare global' was in the removed part
    if 'declare global' in removed_part:
        # We need to restore the declare global block
        # Extract it
        decl_start = removed_part.find('declare global')
        decl_part = removed_part[decl_start:]
        # Remove our addition from the declare part
        # The declare global block starts after the class }
        # In our broken version, the structure is:
        # }\n declare global { ... }\n  MARKER...content...\n}\n
        # We need to extract just: }\n declare global { ... }\n
        # Find the class closing } before declare global
        # Actually the structure after marker_pos is:
        # MARKER...content...\n}\n  <- this is our added closing
        # But the original had: }\n declare global {...}\n
        # Wait, looking at the error output, the original file ends with:
        # }
        # declare global { interface HTMLElementTagNameMap { ... } }
        # And our code was inserted BEFORE the final } of declare global
        
        # Let me just reconstruct: take before_marker, add the original declare global back
        # The original file at 1464 lines had: class body...\n}\ndeclare global...\n}\n
        # We inserted MARKER before the LAST }
        
        # Simplest fix: find the 'declare global' in removed_part and keep from there
        # But we also need the class closing } before it
        
        # The before_marker should end with the class methods
        # We need to add: \n}\n declare global { ... }\n
        # The class } might already be in before_marker if the original had it
        
        # Let's check if before_marker ends with }
        if before_marker.rstrip().endswith('}'):
            # The class } is already there, just need to add declare global
            # Extract declare global block from removed_part
            decl_match = re.search(r"(declare global\s*\{[^}]*\})", removed_part, re.DOTALL)
            if decl_match:
                new_content = before_marker + '\n' + decl_match.group(1) + '\n'
                with open(filepath, 'w') as f:
                    f.write(new_content)
                lines = new_content.count('\n') + 1
                print(f"  FIXED (has declare): {fname}: {lines} lines")
                fixed += 1
                continue
    
    # No declare global - just remove our addition
    # before_marker should already have the class closing }
    # Check: the last line of before_marker
    if before_marker.rstrip().endswith('}'):
        new_content = before_marker + '\n'
        with open(filepath, 'w') as f:
            f.write(new_content)
        lines = new_content.count('\n') + 1
        print(f"  FIXED (no declare): {fname}: {lines} lines")
        fixed += 1
    else:
        print(f"  NEEDS MANUAL FIX: {fname}")

print(f"\nFixed {fixed} files.")
