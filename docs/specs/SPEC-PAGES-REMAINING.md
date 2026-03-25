# SPEC-PAGES: Consolidated Page Specifications

> **Document Version**: 1.0  
> **Created**: 2026-03-08  
> **Purpose**: AI-Implementation-Ready Specifications for remaining SecuClaw pages

---

## SPEC-05: Threats Page

### 1. Purpose
Display threat intelligence, vulnerability distribution, and MITRE ATT&CK mapping.

### 2. Primary Role
**Security Expert** - Vulnerability management, threat analysis

### 3. Component File
`ui/src/ui/pages/sc-threats-page.ts`

### 4. Key Features
- Threat list with severity indicators
- MITRE ATT&CK technique mapping
- Attack surface visualization
- IOC (Indicators of Compromise) display
- Search and filter capabilities

### 5. API Methods
| Method | Description |
|--------|-------------|
| `threats.list` | List all threats |
| `threats.get` | Get threat details |
| `threats.search` | Search threats |
| `knowledge.mitre.search` | Search MITRE mapping |

### 6. UI Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│ Threats Intelligence                                [Security Expert]│
├─────────────────────────────────────────────────────────────────────┤
│ [Search threats...                                        ] [Filter] │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 🔴 Critical: APT29 Active Campaign                              │ │
│ │ MITRE: T1566 (Phishing), T1078 (Valid Accounts)                 │ │
│ │ Discovered: 2026-03-08 | Status: Active                         │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 🟠 High: Ransomware Variant Detection                            │ │
│ │ MITRE: T1486 (Data Encrypted), T1490 (Inhibit Recovery)         │ │
│ │ Discovered: 2026-03-07 | Status: Monitoring                     │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## SPEC-06: Incidents Page

### 1. Purpose
Track and manage security incidents with timeline and response workflow.

### 2. Primary Role
**Security Operations** - SOC operations, incident response

### 3. Component File
`ui/src/ui/pages/sc-incidents-page.ts`

### 4. Key Features
- Incident list with status (Open/Investigating/Resolved)
- Severity classification (Critical/High/Medium/Low)
- Incident timeline view
- Response workflow actions
- Assignment and ownership tracking

### 5. API Methods
| Method | Description |
|--------|-------------|
| `incidents.list` | List all incidents |
| `incidents.get` | Get incident details |
| `incidents.create` | Create new incident |
| `incidents.update` | Update incident |
| `incidents.addNote` | Add note to incident |

### 6. UI Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│ Security Incidents                                  [Security Ops]  │
├─────────────────────────────────────────────────────────────────────┤
│ [Open: 12] [Investigating: 5] [Resolved: 45]          [+ New]       │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 🔴 Critical | INC-2026-001 | API Breach Detected                │ │
│ │ Assigned: John Doe | Created: 2h ago | Status: Investigating    │ │
│ │ [View Timeline] [Add Note] [Escalate]                            │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## SPEC-07: Vulnerabilities Page

### 1. Purpose
Manage vulnerabilities with CVSS scoring and remediation tracking.

### 2. Primary Role
**Security Expert** - Vulnerability management

### 3. Component File
`ui/src/ui/pages/sc-vulnerabilities-page.ts`

### 4. Key Features
- Vulnerability list with CVSS scores
- Affected assets mapping
- Remediation status tracking
- Patch management integration
- Risk-based prioritization

### 5. API Methods
| Method | Description |
|--------|-------------|
| `vulnerabilities.list` | List all vulnerabilities |
| `vulnerabilities.get` | Get vulnerability details |
| `vulnerabilities.update` | Update vulnerability status |

### 6. UI Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│ Vulnerability Management                             [Security Expert]│
├─────────────────────────────────────────────────────────────────────┤
│ [Critical: 5] [High: 23] [Medium: 87] [Low: 156]                    │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ CVE-2024-1234 | CVSS 9.8 | Critical                             │ │
│ │ Apache Log4j Remote Code Execution                               │ │
│ │ Affected: 15 hosts | Status: Patch Available                     │ │
│ │ [Details] [Remediate] [Accept Risk]                              │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## SPEC-08: Compliance Page

### 1. Purpose
Track compliance across multiple frameworks (GDPR, SOC 2, ISO 27001, etc.).

### 2. Primary Role
**CISO** + **Privacy Officer**

### 3. Component File
`ui/src/ui/pages/sc-compliance-page.ts`

### 4. Key Features
- Framework selection (GDPR, SOC 2, ISO 27001, NIST, PCI DSS)
- Control status tracking
- Gap analysis visualization
- Audit trail
- Evidence collection

### 5. API Methods
| Method | Description |
|--------|-------------|
| `compliance.frameworks` | List available frameworks |
| `compliance.status` | Get compliance status |
| `compliance.controls` | Get controls for framework |
| `compliance.updateControl` | Update control status |

### 6. UI Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│ Compliance Audit                                    [CISO]          │
├─────────────────────────────────────────────────────────────────────┤
│ [GDPR ▼] Overall Score: 85%                                         │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Article 5 - Principles                                         │ │
│ │ ████████████░░░░░░░░ 65% (13/20 controls)                       │ │
│ │ [View Controls] [Upload Evidence]                                │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## SPEC-09: Reports Page

### 1. Purpose
Generate and manage security reports.

### 2. Primary Role
**CISO** + **Business Security Officer**

### 3. Component File
`ui/src/ui/pages/sc-reports-page.ts`

### 4. Key Features
- Report templates (Executive Summary, Technical, Compliance)
- Custom report builder
- Export to PDF/Excel
- Scheduled reports
- Historical report archive

### 5. UI Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│ Analysis Reports                                    [CISO]          │
├─────────────────────────────────────────────────────────────────────┤
│ [+ Generate Report] [Schedule Report]                               │
├─────────────────────────────────────────────────────────────────────┤
│ Templates:                                                          │
│ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐  │
│ │ Executive Summary │ │ Technical Report  │ │ Compliance Report │  │
│ │ Monthly risk      │ │ Vulnerability     │ │ Framework audit   │  │
│ │ overview          │ │ assessment        │ │ status            │  │
│ └───────────────────┘ └───────────────────┘ └───────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## SPEC-10: Risk Page

### 1. Purpose
Risk assessment and quantification dashboard.

### 2. Primary Role
**CISO** + **Business Security Officer**

### 3. Component File
`ui/src/ui/pages/sc-risk-page.ts`

### 4. Key Features
- Risk matrix (Impact vs Probability)
- Risk register
- Quantitative risk analysis
- Business impact assessment
- Risk treatment plans

### 5. UI Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│ Security Risk                                       [CISO]          │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Risk Matrix                                                      │ │
│ │           │ Low      │ Medium   │ High     │ Critical │          │ │
│ │ Critical  │    ○     │    ○     │    ●     │    ●     │          │ │
│ │ High      │    ○     │    ●     │    ●     │    ○     │          │ │
│ │ Medium    │    ○     │    ●     │    ○     │    ○     │          │ │
│ │ Low       │    ○     │    ○     │    ○     │    ○     │          │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## SPEC-11: War-Room Page

### 1. Purpose
Real-time security operations command center.

### 2. Primary Role
**SecuClaw Commander** + **Security Operations**

### 3. Component File
`ui/src/ui/pages/sc-war-room-page.ts`

### 4. Key Features
- Real-time security态势 (situation awareness)
- Active incident coordination
- Resource allocation
- Multi-channel communication integration
- Decision support panel

### 5. UI Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│ War Room                                            [Commander]     │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────────────────────────┐ │
│ │ Active Incidents    │ │ Real-time Feed                          │ │
│ │ • INC-001 (Critical)│ │ [10:23] Alert: Suspicious login         │ │
│ │ • INC-002 (High)    │ │ [10:20] Event: Firewall blocked 15 IPs  │ │
│ │ • INC-003 (Medium)  │ │ [10:15] Update: Patch deployed          │ │
│ └─────────────────────┘ └─────────────────────────────────────────┘ │
│ ┌─────────────────────┐ ┌─────────────────────────────────────────┐ │
│ │ Team Status         │ │ Communication                           │ │
│ │ John: Active        │ │ [Feishu] [Telegram] [Slack]             │ │
│ │ Sarah: Active       │ │ Status: Connected                       │ │
│ │ Mike: Offline       │ │                                         │ │
│ └─────────────────────┘ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## SPEC-15: Skills Market Page

### 1. Purpose
Browse, install, and activate security skills.

### 2. Component File
`ui/src/ui/pages/sc-skills-market.ts`

### 3. Key Features
- Available skills listing
- Installed vs available status
- Install/activate functionality
- Skill details and capabilities
- Categories: Dashboard, Threat Intel, Incidents, etc.

### 4. UI Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│ Skills Market                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐  │
│ │ 📊 Dashboard      │ │ 🔍 Threat Intel   │ │ 🚨 Incidents      │  │
│ │ ✅ Installed      │ │ ✅ Active         │ │ ○ Not Installed   │  │
│ │ [Deactivate]      │ │ [Configure]       │ │ [Install]         │  │
│ └───────────────────┘ └───────────────────┘ └───────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## SPEC-16: Channels Page

### 1. Purpose
Manage communication channels for security notifications.

### 2. Component File
`ui/src/ui/pages/sc-channels-page.ts`

### 3. Supported Channels
| Channel | Status | Priority |
|---------|--------|----------|
| Feishu | Implemented | P0 |
| Telegram | Implemented | P0 |
| Slack | Implemented | P0 |
| Discord | Implemented | P0 |
| WhatsApp | Implemented | P0 |
| Google Chat | Implemented | P0 |
| Microsoft Teams | Implemented | P0 |
| Signal | Implemented | P1 |
| iMessage | Implemented | P1 |
| Nostr | Implemented | P1 |

### 4. Key Features
- Channel status monitoring
- Configuration management
- Test message sending
- Notification rules

### 5. UI Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│ Communication Channels                                              │
├─────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐  │
│ │ 🟢 Feishu         │ │ 🟢 Telegram       │ │ 🔴 Slack          │  │
│ │ Connected         │ │ Connected         │ │ Disconnected      │  │
│ │ [Configure]       │ │ [Configure]       │ │ [Configure]       │  │
│ └───────────────────┘ └───────────────────┘ └───────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Summary Table

| Spec | Page | Primary Role | Key Features |
|------|------|--------------|--------------|
| 05 | Threats | Security Expert | Threat list, MITRE mapping, IOC |
| 06 | Incidents | Security Ops | Incident tracking, timeline, workflow |
| 07 | Vulnerabilities | Security Expert | CVE list, CVSS scoring, remediation |
| 08 | Compliance | CISO + Privacy Officer | Framework tracking, gap analysis |
| 09 | Reports | CISO + Business Security | Report templates, export, scheduling |
| 10 | Risk | CISO + Business Security | Risk matrix, quantification |
| 11 | War-Room | Commander + Security Ops | Real-time ops, coordination |
| 15 | Skills Market | All | Skill install/activate |
| 16 | Channels | All | Communication channel config |

---

*End of SPEC-PAGES: Consolidated Page Specifications*
