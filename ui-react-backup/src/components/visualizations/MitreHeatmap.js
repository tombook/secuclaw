import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
/* ── MITRE ATT&CK Lite data ── */
const TACTICS = [
    'Recon',
    'Resource Dev',
    'Initial Access',
    'Execution',
    'Persistence',
    'Priv Esc',
    'Defense Evasion',
    'Credential Access',
    'Discovery',
    'Lateral Movement',
    'Collection',
    'C2',
    'Exfiltration',
    'Impact',
];
// Simplified representative techniques per tactic (2-4 per column)
const TECHNIQUES = {
    Recon: [
        { id: 'T1595', name: 'Active Scanning', coverage: 75 },
        { id: 'T1592', name: 'Gather Host Info', coverage: 60 },
    ],
    'Resource Dev': [
        { id: 'T1587', name: 'Develop Capabilities', coverage: 30 },
        { id: 'T1589', name: 'Gather Victim Identity', coverage: 50 },
    ],
    'Initial Access': [
        { id: 'T1190', name: 'Exploit Public App', coverage: 85 },
        { id: 'T1566', name: 'Phishing', coverage: 70 },
        { id: 'T1078', name: 'Valid Accounts', coverage: 90 },
    ],
    Execution: [
        { id: 'T1059', name: 'Command Scripting', coverage: 80 },
        { id: 'T1203', name: 'Exploitation for Exec', coverage: 45 },
    ],
    Persistence: [
        { id: 'T1053', name: 'Scheduled Task', coverage: 65 },
        { id: 'T1136', name: 'Create Account', coverage: 55 },
    ],
    'Priv Esc': [
        { id: 'T1068', name: 'Exploitation for Priv Esc', coverage: 50 },
        { id: 'T1548', name: 'Abuse Elevation', coverage: 70 },
    ],
    'Defense Evasion': [
        { id: 'T1562', name: 'Impair Defenses', coverage: 80 },
        { id: 'T1070', name: 'Indicator Removal', coverage: 60 },
        { id: 'T1027', name: 'Obfuscated Files', coverage: 55 },
    ],
    'Credential Access': [
        { id: 'T1110', name: 'Brute Force', coverage: 85 },
        { id: 'T1552', name: 'Unsecured Creds', coverage: 65 },
    ],
    Discovery: [
        { id: 'T1082', name: 'System Info Discovery', coverage: 75 },
        { id: 'T1046', name: 'Network Service Disc', coverage: 60 },
    ],
    'Lateral Movement': [
        { id: 'T1021', name: 'Remote Services', coverage: 70 },
        { id: 'T1570', name: 'Lateral Tool Transfer', coverage: 40 },
    ],
    Collection: [
        { id: 'T1005', name: 'Data from Local', coverage: 55 },
        { id: 'T1039', name: 'Data from Network', coverage: 45 },
    ],
    C2: [
        { id: 'T1071', name: 'Application Layer Proto', coverage: 65 },
        { id: 'T1573', name: 'Encrypted Channel', coverage: 50 },
    ],
    Exfiltration: [
        { id: 'T1041', name: 'Exfil over C2', coverage: 60 },
        { id: 'T1567', name: 'Exfil over Web', coverage: 55 },
    ],
    Impact: [
        { id: 'T1486', name: 'Data Encrypted for Impact', coverage: 70 },
        { id: 'T1489', name: 'Service Stop', coverage: 80 },
    ],
};
function coverageToOpacity(coverage) {
    // Map 0-100 → 0.1-1.0
    return 0.1 + (coverage / 100) * 0.9;
}
// Role-specific MITRE coverage — each role emphasizes different tactics
const ROLE_COVERAGE = {
    'security-expert': { 'Reconnaissance': 95, 'Resource Development': 80, 'Initial Access': 90, 'Execution': 95, 'Persistence': 88, 'Privilege Escalation': 85, 'Defense Evasion': 70, 'Credential Access': 88, 'Discovery': 92, 'Lateral Movement': 80, 'Collection': 85, 'Command and Control': 75, 'Exfiltration': 78, 'Impact': 82 },
    'privacy-officer': { 'Reconnaissance': 60, 'Resource Development': 50, 'Initial Access': 70, 'Execution': 65, 'Persistence': 55, 'Privilege Escalation': 50, 'Defense Evasion': 60, 'Credential Access': 75, 'Discovery': 70, 'Lateral Movement': 50, 'Collection': 95, 'Command and Control': 45, 'Exfiltration': 98, 'Impact': 92 },
    'security-architect': { 'Reconnaissance': 85, 'Resource Development': 90, 'Initial Access': 88, 'Execution': 85, 'Persistence': 92, 'Privilege Escalation': 95, 'Defense Evasion': 88, 'Credential Access': 85, 'Discovery': 90, 'Lateral Movement': 88, 'Collection': 80, 'Command and Control': 85, 'Exfiltration': 80, 'Impact': 85 },
    'business-security-officer': { 'Reconnaissance': 70, 'Resource Development': 65, 'Initial Access': 75, 'Execution': 70, 'Persistence': 60, 'Privilege Escalation': 55, 'Defense Evasion': 65, 'Credential Access': 60, 'Discovery': 70, 'Lateral Movement': 60, 'Collection': 75, 'Command and Control': 55, 'Exfiltration': 70, 'Impact': 90 },
    'secuclaw-commander': { 'Reconnaissance': 80, 'Resource Development': 75, 'Initial Access': 85, 'Execution': 90, 'Persistence': 85, 'Privilege Escalation': 80, 'Defense Evasion': 75, 'Credential Access': 80, 'Discovery': 85, 'Lateral Movement': 90, 'Collection': 82, 'Command and Control': 95, 'Exfiltration': 85, 'Impact': 88 },
    'ciso': { 'Reconnaissance': 70, 'Resource Development': 68, 'Initial Access': 72, 'Execution': 70, 'Persistence': 68, 'Privilege Escalation': 65, 'Defense Evasion': 70, 'Credential Access': 68, 'Discovery': 72, 'Lateral Movement': 65, 'Collection': 70, 'Command and Control': 65, 'Exfiltration': 70, 'Impact': 80 },
    'security-ops': { 'Reconnaissance': 88, 'Resource Development': 70, 'Initial Access': 92, 'Execution': 95, 'Persistence': 85, 'Privilege Escalation': 88, 'Defense Evasion': 80, 'Credential Access': 90, 'Discovery': 95, 'Lateral Movement': 85, 'Collection': 88, 'Command and Control': 92, 'Exfiltration': 80, 'Impact': 85 },
    'supply-chain-security': { 'Reconnaissance': 75, 'Resource Development': 95, 'Initial Access': 88, 'Execution': 80, 'Persistence': 90, 'Privilege Escalation': 78, 'Defense Evasion': 72, 'Credential Access': 75, 'Discovery': 80, 'Lateral Movement': 70, 'Collection': 82, 'Command and Control': 68, 'Exfiltration': 75, 'Impact': 85 },
};
export const MitreHeatmap = ({ roleId = 'security-expert', accentColor = 'var(--role-primary, #1e40af)', className = '', }) => {
    const roleCoverage = ROLE_COVERAGE[roleId] || ROLE_COVERAGE['security-expert'];
    const maxRows = Math.max(...Object.values(TECHNIQUES).map((t) => t.length));
    return (_jsx(TooltipProvider, { delayDuration: 200, children: _jsxs("div", { className: `overflow-x-auto ${className}`, children: [_jsx("div", { className: "grid gap-1 mb-1 min-w-[900px]", style: { gridTemplateColumns: `repeat(${TACTICS.length}, minmax(60px, 1fr))` }, children: TACTICS.map((tactic) => (_jsx("div", { className: "text-[10px] font-semibold text-center py-1 px-0.5 truncate", style: { color: 'var(--role-text-secondary, #94a3b8)' }, children: tactic }, tactic))) }), Array.from({ length: maxRows }).map((_, rowIdx) => (_jsx("div", { className: "grid gap-1 mb-1 min-w-[900px]", style: { gridTemplateColumns: `repeat(${TACTICS.length}, minmax(60px, 1fr))` }, children: TACTICS.map((tactic) => {
                        const cell = TECHNIQUES[tactic]?.[rowIdx];
                        if (!cell)
                            return _jsx("div", {}, tactic);
                        return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("div", { className: "rounded-sm flex items-center justify-center text-[10px] font-medium cursor-pointer transition-colors hover:ring-1 hover:ring-white/20", style: {
                                            backgroundColor: accentColor,
                                            opacity: coverageToOpacity(roleCoverage[tactic] ?? 50),
                                            color: 'var(--role-text, #f1f5f9)',
                                            height: 32,
                                        }, children: cell.id }) }), _jsxs(TooltipContent, { side: "top", className: "bg-[#0f1525] border border-white/10 text-white text-xs", children: [_jsx("div", { className: "font-semibold", children: cell.name }), _jsxs("div", { className: "text-white/60", children: ["Coverage: ", roleCoverage[tactic] ?? 50, "%"] })] })] }, `${tactic}-${cell.id}`));
                    }) }, rowIdx)))] }) }));
};
export default MitreHeatmap;
//# sourceMappingURL=MitreHeatmap.js.map