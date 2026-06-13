# SecuClaw User Guide v1.0.0

> **Complete walkthrough** for end-users, security analysts, and MSSP administrators.

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard Tour](#2-dashboard-tour)
3. [9 Top-Tier Security Capabilities](#3-9-top-tier-security-capabilities)
4. [Common Workflows](#4-common-workflows)
5. [Best Practices](#5-best-practices)
6. [FAQs](#6-faqs)

---

## 1. Getting Started

### 1.1 Create Your Account

1. Visit `https://app.secuclaw.com`
2. Click **🚀 14 天免费试用** in the top right
3. Fill in your details:
   - Full name
   - Company name
   - Work email
   - Password (min 8 characters)
4. Select a plan (you can start with **Free** and upgrade later)
5. Click **🚀 创建账号 + 14 天试用**

You will receive a welcome email and can immediately log in.

### 1.2 First Login

1. Visit `https://app.secuclaw.com/#/auth?mode=login`
2. Enter your email and password
3. (Optional) Use **Google SSO** / **Okta** / **Azure AD** if your organization has configured SSO

### 1.3 Initial Setup (5 minutes)

1. **Add Users**: Settings → Users → Invite Team
2. **Configure SSO** (optional): Settings → Authentication → SSO
3. **Connect Cloud Accounts**: Settings → Cloud → AWS/Azure/GCP/阿里云
4. **Set Notification Channels**: Settings → Notifications → Email/Slack/PagerDuty

---

## 2. Dashboard Tour

### 2.1 Overview Page (`#/`)

The **Overview** page is your single-pane-of-glass view of all 9 security capabilities.

**KPI Cards** (top):
- **Overall Posture Score** (0-100): Higher is better
- **Active Incidents**: Critical/High/Medium/Low breakdown
- **Open Detections**: Number of unaddressed findings
- **MTTD/MTTR**: Mean Time To Detect / Resolve

**Heat Map** (center):
- 9 capabilities × severity heatmap
- Click any cell to drill down

**Activity Stream** (right):
- Real-time feed of detections, alerts, automated responses
- Filter by severity, capability, user

### 2.2 Roles View (`#/roleId`)

Each **role** has a dedicated **commander page**:
- **👤 CISO** (`#/ciso`): Strategic dashboard, board reports
- **🛡️ Security Architect** (`#/security-architect`): Architecture review
- **🛡️ Security Expert** (`#/security-expert`): Deep technical work
- **🛡️ Security Ops** (`#/security-ops`): Day-to-day SOC
- **💼 CISO** / **Privacy Officer** / **Business Security Officer** / **Supply Chain Security**

### 2.3 New Capabilities Hub (`#/new-modules`)

9 dashboard modules in a single hub:
- **SOAR** (告警关联)
- **UEBA** (行为基线)
- **Sigma** (检测工程)
- **AI-SCM** (工具链)
- **EASM** (外部攻击面)
- **RASP** (运行时自保护)
- **DSPM** (数据安全)
- **ITDR** (身份威胁)
- **SaaS** (运营中心)

---

## 3. 9 Top-Tier Security Capabilities

### 3.1 🌐 EASM — External Attack Surface Management

**What it does**: Discovers and monitors all your internet-facing assets (domains, subdomains, IPs, ports, exposed services).

**Key Features**:
- Asset discovery (Shodan/Censys integration)
- Subdomain enumeration
- Open port detection
- SSL/TLS certificate monitoring
- Leaked credential detection (GitHub, GitLab, S3 buckets)
- Phishing site detection (brand protection)

**Use Cases**:
1. **Find Shadow IT**: Discover domains you didn't know you had
2. **Detect Certificate Expiry**: Get alerts 30 days before SSL expiry
3. **Identify Exposed Services**: S3 buckets, RDP servers, databases accidentally exposed
4. **Monitor Brand Abuse**: Detect phishing sites using your brand

**Daily Workflow**:
1. Open EASM dashboard
2. Review new assets (1 new subdomain added)
3. Check for any "critical" findings (SSL expired, S3 bucket public)
4. Investigate any leaked credentials → rotate immediately

### 3.2 ☁️ CSPM — Cloud Security Posture Management

**What it does**: Continuously monitors your cloud configurations for security misconfigurations and compliance violations.

**Supported Clouds**: AWS, Azure, GCP, 阿里云, 腾讯云, 华为云

**Compliance Frameworks**: CIS Benchmark, PCI DSS, GDPR, PIPL, SOC 2

**Common Findings**:
- S3 buckets with public access
- IAM users without MFA
- Security groups allowing 0.0.0.0/0
- Unencrypted databases (RDS, CosmosDB)
- CloudTrail logging disabled
- Root access keys not rotated

**Use Cases**:
1. **Continuous Compliance**: Auto-scan every hour, alert on new violations
2. **Multi-Cloud Visibility**: Single dashboard for all your cloud accounts
3. **Drift Detection**: Alert when config changes break compliance
4. **Auto-Remediation**: Some findings can be auto-fixed (e.g., enable S3 encryption)

### 3.3 💾 DSPM — Data Security Posture Management

**What it does**: Discovers, classifies, and protects sensitive data across your entire organization.

**Sensitive Data Detection**:
- PII: Email, phone, ID card, SSN, credit card
- PHI: Medical records (HIPAA)
- PCI: Credit card numbers (PCI DSS)
- Confidential: Source code, financial reports
- Regulated: GDPR, PIPL, CCPA

**Key Features**:
- Automated data discovery (scan databases, S3, file shares)
- Smart classification (regex + ML + AI)
- Data flow tracking (where data goes)
- Cross-border transfer monitoring (PIPL compliance)
- Data access analytics (who accessed what)

**Use Cases**:
1. **PIPL/GDPR Compliance**: Monitor cross-border data transfers
2. **Sensitive Data Inventory**: Find all places with PII
3. **Data Exfiltration Detection**: Detect unusual data downloads
4. **Data Subject Access Requests (DSAR)**: Quickly find all data for a user

### 3.4 🛡️ RASP — Runtime Application Self-Protection

**What it does**: Protects your applications in real-time by detecting and blocking attacks as they happen.

**Attack Types Detected**:
- **SQL Injection** (15+ patterns): UNION SELECT, OR 1=1, WAITFOR DELAY, etc.
- **XSS**: `<script>`, event handlers, JavaScript URIs
- **API Abuse**: Brute force, scraping, account takeover
- **Path Traversal**: `../`, `..\\`
- **Command Injection**: `; cmd`, `| nc`
- **XXE**, **SSRF**, **Deserialization**

**How it Works**:
- Monitors every HTTP request
- Inspects URL parameters, POST body, headers, cookies
- Compares against thousands of attack patterns
- Blocks malicious requests in real-time
- Allows sanitization (escape but allow) for medium severity

**Use Cases**:
1. **Zero-Day Protection**: Block unknown attacks based on behavior
2. **WAF Replacement**: More accurate than signature-based WAFs
3. **Compliance**: PCI DSS requirement 6.5

### 3.5 🔐 ITDR — Identity Threat Detection & Response

**What it does**: Detects and responds to identity-based attacks (the #1 attack vector in 2026).

**Detected Threats**:
- **Credential Stuffing**: Using leaked passwords
- **Brute Force**: Repeated password guessing
- **Password Spraying**: Common passwords across many users
- **MFA Bypass**: SIM swap, prompt bombing
- **MFA Fatigue**: Repeated push notifications to wear down user
- **Lateral Movement**: Pass-the-Hash, Kerberoasting, Pass-the-Ticket
- **Session Hijacking**: Stolen session tokens
- **OAuth Abuse**: Token theft, scope abuse

**Automated Responses**:
- Force password reset
- Require MFA re-enrollment
- Block IP address
- Disable account
- Revoke active sessions
- Isolate host (for lateral movement)

**Use Cases**:
1. **Active Directory Protection**: Detect Kerberoasting, DCShadow
2. **Cloud Identity Protection**: AWS/Azure AD credential abuse
3. **MFA Bypass Detection**: Catch SIM swap and prompt bombing
4. **Automated Containment**: Block attacker in seconds, not hours

### 3.6 🤖 AI-SCM — AI Supply Chain Security

**What it does**: Secures your AI/ML supply chain, including LLMs, agents, and MCP (Model Context Protocol) tools.

**Key Features**:
- **MCP Risk Scoring**: Evaluate every AI tool (read/write/exec permissions, data access)
- **Prompt Injection Detection**: Catch 15+ injection patterns
- **Agent Behavior Audit**: Monitor AI agent actions
- **LLM Output Validation**: Detect hallucination, data leakage
- **Model Risk**: Track which LLMs are used where

**Why It Matters**:
- AI agents have powerful tools (file system, shell, network)
- Prompt injection is the #1 AI attack vector
- LLM hallucinations can leak sensitive data
- Untrusted MCP tools can exfiltrate data

**Use Cases**:
1. **MCP Tool Approval**: Risk-score every tool before allowing agent use
2. **Prompt Firewall**: Block injection attempts before they reach the LLM
3. **Agent SOC**: Audit all AI agent actions
4. **LLM Security**: Detect prompt leaks, data exfiltration

### 3.7 ⚡ SOAR — Security Orchestration, Automation & Response

**What it does**: Correlates alerts, automates responses, and orchestrates your security tools.

**Key Features**:
- **Alert Correlation**: Group related alerts into incidents (MITRE ATT&CK chains)
- **Playbook Engine**: Visual workflow editor for response automation
- **Multi-Tool Orchestration**: Connect Slack, Jira, PagerDuty, ServiceNow, AWS, Azure
- **MITRE ATT&CK Mapping**: Auto-map attacks to ATT&CK techniques

**Example Playbooks**:
- **Brute Force Response**: Block IP + force password reset + notify user + open ticket
- **Phishing Response**: Quarantine email + scan for IOCs + notify SOC
- **Data Exfiltration Response**: Disable account + isolate host + preserve evidence

### 3.8 🧠 UEBA — User & Entity Behavior Analytics

**What it does**: Detects insider threats and compromised accounts by learning normal behavior.

**Key Features**:
- **Baseline Learning**: 30+ days of activity to build normal profile
- **Anomaly Detection**: Statistical + ML-based scoring
- **Risk Scoring**: Continuous per-user/per-host risk score
- **Insider Threat Detection**: Detect unusual data access patterns
- **Compromised Account Detection**: Spot behavior deviation

**Use Cases**:
1. **Insider Threat**: Detect data exfiltration by trusted employees
2. **Compromised Account**: Spot the moment an account is hijacked
3. **Privilege Abuse**: Detect unusual admin actions
4. **Lateral Movement**: Catch attackers moving between systems

### 3.9 💼 SaaS Operations

**What it does**: Run SecuClaw as a multi-tenant SaaS platform for your customers (for MSSPs) or your own organization.

**Key Features**:
- **Multi-Tenant Isolation**: Strict data + API isolation per tenant
- **Subscription Management**: 5 pricing tiers (Free/Starter/Professional/Enterprise/MSSP)
- **Invoice Generation**: Automated billing, tax, multi-currency
- **Multi-Channel Notifications**: Email/SMS/Slack/Teams/PagerDuty
- **Audit Compliance**: Blockchain-verified tamper-evident logs
- **Multi-Region Deployment**: 12 regions, 4 deployment strategies

---

## 4. Common Workflows

### 4.1 Respond to a Brute Force Attack

1. **Detection**: ITDR dashboard shows "Brute Force Detected"
2. **Investigation**: Click the detection → see source IP, targeted user, attack timeline
3. **Context**: Check UEBA → see if user has unusual behavior
4. **Action**: Click "Block IP" + "Force Password Reset"
5. **Notification**: User receives email + SMS
6. **Audit**: All actions logged to blockchain
7. **Postmortem**: Use SOAR to document lessons learned

### 4.2 Onboard a New Cloud Account

1. Settings → Cloud → Add Account
2. Select cloud (AWS/Azure/GCP/阿里云)
3. Grant read-only permissions (IAM role / Service Principal)
4. CSPM auto-discovers all resources
5. Review findings: ~50 typical misconfigurations
6. Auto-remediate low-risk, manual review for high-risk
7. Set up continuous scanning (every hour)

### 4.3 Investigate a Data Leak

1. DSPM → "Data Flow" tab
2. Find the suspicious flow (e.g., CN user accessing US bucket)
3. Check residency policies → confirm violation
4. Identify the user, source system, destination
5. UEBA → see if this is normal or anomalous
6. Decision: Block / Sanction / Investigate
7. Audit → log the decision

### 4.4 Quarterly Compliance Audit

1. Open "Audit" page → Generate report (JSON/CSV/SIEM)
2. Filter by timeframe (90 days)
3. Filter by severity (critical + high only)
4. Export to SIEM (Splunk/QRadar/Elastic)
5. Verify blockchain integrity (`saas.audit.verify-chain`)
6. Review with auditor

---

## 5. Best Practices

### 5.1 Configuration

✅ **Enable** automatic remediation for low-risk findings
✅ **Set** quiet hours for notifications (e.g., 22:00-07:00 for non-critical)
✅ **Configure** multiple notification channels (email + Slack)
✅ **Enable** audit chain verification (24-hour interval)
✅ **Set** backup retention to 30 days minimum

❌ **Don't** disable notifications entirely
❌ **Don't** ignore critical findings
❌ **Don't** share admin credentials

### 5.2 Incident Response

1. **First 5 minutes**: Acknowledge the alert
2. **First 15 minutes**: Containment (block IP, disable account)
3. **First 1 hour**: Investigation (logs, UEBA, scope)
4. **First 24 hours**: Eradication (patch, rotate, rebuild)
5. **First 1 week**: Recovery + postmortem

### 5.3 Multi-Tenant Isolation

If you're an MSSP:
- ✅ Use strict tenant isolation (`TENANT_ISOLATION_STRICT=true`)
- ✅ Never share API keys across tenants
- ✅ Use separate encryption keys per tenant
- ✅ Audit all cross-tenant access

---

## 6. FAQs

**Q: Is my data encrypted?**
A: Yes. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Encryption keys are per-tenant and managed via KMS.

**Q: Can I export my data?**
A: Yes. All data can be exported in JSON, CSV, or SIEM format. Use the audit export endpoint for compliance.

**Q: What happens if SecuClaw goes down?**
A: We have 99.99% SLA for Enterprise tier. Status page: status.secuclaw.com

**Q: Can I deploy SecuClaw on-premises?**
A: Yes. We support on-premises deployment for Enterprise customers. Contact sales@secuclaw.com

**Q: How do you handle GDPR/PIPL?**
A: Data residency is configurable. We support EU, US, CN, and 9 other regions. PIPL policies are built-in.

**Q: Can I integrate with my existing SIEM?**
A: Yes. We support Splunk, QRadar, Elastic, Sentinel, Chronicle via SIEM-format export and Syslog forwarding.

**Q: How is pricing calculated?**
A: Based on users, API calls, storage, and retention. See [Pricing](https://secuclaw.com/pricing) for details.

**Q: Do you offer a free trial?**
A: Yes, 14-day free trial of the Professional plan. No credit card required.

**Q: What support is included?**
- Free: Community forum
- Starter: Email support (48h SLA)
- Professional: Email + chat support (24h SLA)
- Enterprise: 24x7 phone + dedicated CSM (1h SLA)
- MSSP: 24x7 + on-site

## Support

- **Documentation**: https://docs.secuclaw.com
- **Community**: https://community.secuclaw.com
- **Email**: support@secuclaw.com
- **Phone (Enterprise)**: +1-800-SECUCLAW
- **Status**: https://status.secuclaw.com
