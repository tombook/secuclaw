# SecuClaw Product Design Index

> **Version**: 1.0  
> **Created**: 2026-03-08  
> **Status**: Complete

---

## Overview

This document indexes all AI-implementation-ready product design specifications for the SecuClaw Security Commander System.

---

## Specification Documents

### Foundation Specs (Wave 1)

| Spec | File | Description |
|------|------|-------------|
| SPEC-01 | `SPEC-01-PROJECT-INIT.md` | Project initialization, package.json, configs, directory structure |
| SPEC-02 | `SPEC-02-FRONTEND-ARCH.md` | Frontend architecture, Lit components, router, state management, i18n, themes |
| SPEC-03 | `SPEC-03-BACKEND-ARCH.md` | Backend architecture, WebSocket gateway, REST APIs, data layer, services |

### Page Specs (Wave 2)

| Spec | File | Page | Primary Role |
|------|------|------|--------------|
| SPEC-04 | `SPEC-04-DASHBOARD.md` | Dashboard | CISO |
| SPEC-05-11, 15-16 | `SPEC-PAGES-REMAINING.md` | Threats, Incidents, Vulnerabilities, Compliance, Reports, Risk, War-Room, Skills Market, Channels | Various |

### Specialized Specs (Wave 3)

| Spec | File | Description |
|------|------|-------------|
| SPEC-12 | `SPEC-12-AI-EXPERTS.md` | AI Experts page with 8 role cards, skills display, chat interface |
| SPEC-13 | `SPEC-13-KNOWLEDGE-BASE.md` | Knowledge base for MITRE ATT&CK and SCF data |
| SPEC-14 | `SPEC-14-SETTINGS.md` | LLM provider config, AI expert role binding, system settings |
| SPEC-15 | `SPEC-15-CAPABILITIES-CENTER.md` | 6-domain capabilities center with task/run/approval/evidence workflow |

---

## 8 Security Roles

| ID | Name | Emoji | Focus |
|----|------|-------|-------|
| security-expert | Security Expert | 🛡️ | Vulnerability management, penetration testing |
| privacy-officer | Privacy Officer | 🔐 | Privacy compliance, GDPR/CCPA |
| security-architect | Security Architect | 🏗️ | Security architecture, zero trust |
| business-security-officer | Business Security Officer | 📊 | Business continuity, risk quantification |
| secuclaw-commander | SecuClaw Commander | 🎯 | Full-spectrum security command |
| ciso | CISO | 👔 | Security strategy, compliance governance |
| security-ops | Security Operations | ⚙️ | SOC operations, incident response |
| supply-chain-security | Supply Chain Security | 🔗 | Vendor security, third-party risk |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Lit (Web Components) + Vite + TypeScript |
| Backend | Bun/Node.js + WebSocket (port 21981) |
| Storage | JSON Files + SQLite |
| i18n | zh-CN (default), en, zh-TW |

---

## Knowledge Sources

| Source | Path | Description |
|--------|------|-------------|
| MITRE ATT&CK | `data/mitre/attack-stix-data/` | Enterprise, Mobile, ICS attack frameworks |
| SCF | `data/scf/` | Secure Controls Framework 2025.4 |
| Skills | `skills/*/SKILL.md` | 8 security role definitions |

---

## API Summary

### WebSocket Methods
- `skills.*` - Skill management
- `knowledge.mitre.*` - MITRE ATT&CK queries
- `knowledge.scf.*` - SCF queries
- `commander.*` - Commander management
- `llm.*` - LLM provider management
- `channels.*` - Communication channels
- `capabilities.*` - Capabilities center (domains, tasks, runs, approvals, evidence)

### REST Endpoints
- `/api/knowledge/*` - Knowledge base data
- `/api/skills/*` - Skill definitions
- `/api/llm/*` - LLM provider config

---

## Implementation Order

1. **Phase 1**: Project init (SPEC-01) + Core architecture (SPEC-02, SPEC-03)
2. **Phase 2**: Dashboard (SPEC-04) + AI Experts (SPEC-12)
3. **Phase 3**: Knowledge Base (SPEC-13) + Settings (SPEC-14)
4. **Phase 4**: Remaining pages (SPEC-PAGES-REMAINING.md)

---

## Files Created

```
docs/specs/
├── SPEC-01-PROJECT-INIT.md
├── SPEC-02-FRONTEND-ARCH.md
├── SPEC-03-BACKEND-ARCH.md
├── SPEC-04-DASHBOARD.md
├── SPEC-12-AI-EXPERTS.md
├── SPEC-13-KNOWLEDGE-BASE.md
├── SPEC-14-SETTINGS.md
├── SPEC-15-CAPABILITIES-CENTER.md
├── SPEC-PAGES-REMAINING.md
└── README.md (this file)
```

---

## Verification Checklist

- [x] All 16 specs created
- [x] Complete TypeScript interfaces included
- [x] API endpoints documented
- [x] UI wireframes provided
- [x] File paths specified
- [x] Component structures defined
- [x] Data models documented
- [x] i18n keys defined

---

*End of SecuClaw Product Design Index*
