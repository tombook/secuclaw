/**
 * Open Source Tool Mapping for SecuClaw Tool Market
 *
 * Maps each built-in tool ID to a real open-source alternative or marks it as coming-soon.
 * SecuHub URLs follow the pattern: https://secuhub.io/tool/{toolId}
 */

export interface OpenSourceToolInfo {
  /** Open source project name */
  name: string;
  /** GitHub repository URL (empty string if none) */
  githubUrl: string;
  /** Brief project description */
  description: string;
  /** available = real open-source tool exists, coming-soon = pending AI development */
  status: 'available' | 'coming-soon';
  /** SecuHub project page link */
  secuhubUrl: string;
  /** License (e.g. AGPL-3.0, Apache-2.0) */
  license?: string;
  /** Approximate GitHub stars count */
  stars?: number;
}

// IDs must match manifests/index.ts and role-tool-config.ts — verify before adding entries
export const OPEN_SOURCE_TOOLS: Record<string, OpenSourceToolInfo> = {
  // ─── Security Operations ─────────────────────────────
  'alert-queue': {
    name: 'TheHive',
    githubUrl: 'https://github.com/thehive-project/thehive',
    description: 'Scalable, open source and free Security Incident Response Platform',
    status: 'available',
    secuhubUrl: 'https://secuhub.io/tool/alert-queue',
    license: 'AGPL-3.0',
    stars: 6200,
  },
  'soar-exec': {
    name: 'Shuffle',
    githubUrl: 'https://github.com/Shuffle/Shuffle',
    description: 'Open source security automation platform for SOAR workflows',
    status: 'available',
    secuhubUrl: 'https://secuhub.io/tool/soar-exec',
    license: 'Apache-2.0',
    stars: 5400,
  },

  // ─── Security Expert ─────────────────────────────────
  'vuln-scan': {
    name: 'Trivy',
    githubUrl: 'https://github.com/aquasecurity/trivy',
    description: 'Comprehensive security scanner for containers, IaC, and dependencies',
    status: 'available',
    secuhubUrl: 'https://secuhub.io/tool/vuln-scan',
    license: 'Apache-2.0',
    stars: 24500,
  },
  'threat-intel': {
    name: 'OpenCTI',
    githubUrl: 'https://github.com/OpenCTI-Platform/opencti',
    description: 'Open source threat intelligence platform for cyber threat knowledge management',
    status: 'available',
    secuhubUrl: 'https://secuhub.io/tool/threat-intel',
    license: 'Apache-2.0',
    stars: 6800,
  },

  // ─── Security Commander ──────────────────────────────
  'global-situation': {
    name: 'SecuClaw AI',
    githubUrl: '',
    description: 'AI-driven global security situational awareness dashboard',
    status: 'coming-soon',
    secuhubUrl: 'https://secuhub.io/tool/global-situation',
  },

  // ─── CISO ────────────────────────────────────────────
  'risk-score': {
    name: 'SecuClaw AI',
    githubUrl: '',
    description: 'AI-powered multi-dimensional risk scoring and assessment engine',
    status: 'coming-soon',
    secuhubUrl: 'https://secuhub.io/tool/risk-score',
  },
  'board-report': {
    name: 'SecuClaw AI',
    githubUrl: '',
    description: 'AI-generated board-level security reporting and executive summaries',
    status: 'coming-soon',
    secuhubUrl: 'https://secuhub.io/tool/board-report',
  },

  // ─── Privacy Officer ─────────────────────────────────
  'compliance-chk': {
    name: 'ComplianceAsCode',
    githubUrl: 'https://github.com/complianceascode/content',
    description: 'Security compliance content in machine-readable format (SCAP, Bash, Ansible)',
    status: 'available',
    secuhubUrl: 'https://secuhub.io/tool/compliance-chk',
    license: 'BSD-3-Clause',
    stars: 2400,
  },

  // ─── Security Architect ──────────────────────────────
  'threat-model': {
    name: 'OWASP Threat Dragon',
    githubUrl: 'https://github.com/OWASP/threat-dragon',
    description: 'Free, open source threat modeling tool from OWASP with STRIDE support',
    status: 'available',
    secuhubUrl: 'https://secuhub.io/tool/threat-model',
    license: 'Apache-2.0',
    stars: 2200,
  },

  // ─── Business Security Officer ───────────────────────
  'bcp-mgmt': {
    name: 'SecuClaw AI',
    githubUrl: '',
    description: 'Business continuity planning and disaster recovery management platform',
    status: 'coming-soon',
    secuhubUrl: 'https://secuhub.io/tool/bcp-mgmt',
  },

  // ─── Supply Chain Security ───────────────────────────
  'sbom-scan': {
    name: 'Syft',
    githubUrl: 'https://github.com/anchore/syft',
    description: 'CLI tool for generating Software Bill of Materials (SBOM) from container images and filesystems',
    status: 'available',
    secuhubUrl: 'https://secuhub.io/tool/sbom-scan',
    license: 'Apache-2.0',
    stars: 5800,
  },
  'pen-test': {
    name: 'OWASP ZAP',
    githubUrl: 'https://github.com/zaproxy/zaproxy',
    description: 'World\'s most widely used free web application security scanner',
    status: 'available',
    secuhubUrl: 'https://secuhub.io/tool/pen-test',
    license: 'Apache-2.0',
    stars: 12200,
  },

  // ─── Privacy / GDPR ──────────────────────────────────
  'gdpr-audit': {
    name: 'SecuClaw AI',
    githubUrl: '',
    description: 'Comprehensive GDPR compliance auditing and gap analysis engine',
    status: 'coming-soon',
    secuhubUrl: 'https://secuhub.io/tool/gdpr-audit',
  },

  // ─── Zero Trust ──────────────────────────────────────
  'zero-trust': {
    name: 'SecuClaw AI',
    githubUrl: '',
    description: 'Zero Trust architecture maturity assessment and compliance evaluation',
    status: 'coming-soon',
    secuhubUrl: 'https://secuhub.io/tool/zero-trust',
  },

  // ─── Reporting ───────────────────────────────────────
  'report-gen': {
    name: 'SecuClaw AI',
    githubUrl: '',
    description: 'AI-powered security posture report generation with multi-format export',
    status: 'coming-soon',
    secuhubUrl: 'https://secuhub.io/tool/report-gen',
  },

  // ─── AI Dispatch ─────────────────────────────────────
  'ai-dispatch': {
    name: 'SecuClaw AI',
    githubUrl: '',
    description: 'AI-driven security event analysis and intelligent task orchestration',
    status: 'coming-soon',
    secuhubUrl: 'https://secuhub.io/tool/ai-dispatch',
  },

  // ─── KPI Tracking ────────────────────────────────────
  'kpi-track': {
    name: 'SecuClaw AI',
    githubUrl: '',
    description: 'Security operations KPI tracking with trend analysis and dashboards',
    status: 'coming-soon',
    secuhubUrl: 'https://secuhub.io/tool/kpi-track',
  },

  // ─── Incident Management ─────────────────────────────
  'incident-mgmt': {
    name: 'DFIR-IRIS',
    githubUrl: 'https://github.com/dfir-iris/iris-web',
    description: 'Free and open source Security Incident Response Platform for DFIR teams',
    status: 'available',
    secuhubUrl: 'https://secuhub.io/tool/incident-mgmt',
    license: 'MIT',
    stars: 2400,
  },

  // ─── Log Analysis ────────────────────────────────────
  'log-analysis': {
    name: 'Wazuh',
    githubUrl: 'https://github.com/wazuh/wazuh',
    description: 'Free open source security monitoring platform with SIEM and XDR capabilities',
    status: 'available',
    secuhubUrl: 'https://secuhub.io/tool/log-analysis',
    license: 'GPL-2.0',
    stars: 12000,
  },

  // ─── Vendor Evaluation ───────────────────────────────
  'vendor-eval': {
    name: 'SecuClaw AI',
    githubUrl: '',
    description: 'Third-party vendor security risk assessment and scoring platform',
    status: 'coming-soon',
    secuhubUrl: 'https://secuhub.io/tool/vendor-eval',
  },

  // ─── Risk Register ───────────────────────────────────
  'risk-register': {
    name: 'SecuClaw AI',
    githubUrl: '',
    description: 'Enterprise risk register with heat maps and SCF domain mapping',
    status: 'coming-soon',
    secuhubUrl: 'https://secuhub.io/tool/risk-register',
  },

  // ─── Budget Dashboard ────────────────────────────────
  'budget-dash': {
    name: 'SecuClaw AI',
    githubUrl: '',
    description: 'Security budget allocation tracking and cost optimization analytics',
    status: 'coming-soon',
    secuhubUrl: 'https://secuhub.io/tool/budget-dash',
  },

  // ─── Policy Management ───────────────────────────────
  'policy-mgmt': {
    name: 'Open Policy Agent',
    githubUrl: 'https://github.com/open-policy-agent/opa',
    description: 'General-purpose policy engine for unified policy enforcement across the stack',
    status: 'available',
    secuhubUrl: 'https://secuhub.io/tool/policy-mgmt',
    license: 'Apache-2.0',
    stars: 10200,
  },

  // ─── Data Map ────────────────────────────────────────
  'data-map': {
    name: 'Apache Atlas',
    githubUrl: 'https://github.com/apache/atlas',
    description: 'Metadata management and data governance platform with data lineage',
    status: 'available',
    secuhubUrl: 'https://secuhub.io/tool/data-map',
    license: 'Apache-2.0',
    stars: 1600,
  },

  // ─── Cost Calculator ─────────────────────────────────
  'cost-calc': {
    name: 'SecuClaw AI',
    githubUrl: '',
    description: 'Security investment ROI and breach cost impact calculator',
    status: 'coming-soon',
    secuhubUrl: 'https://secuhub.io/tool/cost-calc',
  },

  // ─── Patch Management ────────────────────────────────
  'patch-mgmt': {
    name: 'SecuClaw AI',
    githubUrl: '',
    description: 'Automated patch scanning, prioritization, and deployment tracking',
    status: 'coming-soon',
    secuhubUrl: 'https://secuhub.io/tool/patch-mgmt',
  },

  // ─── IAM Configuration ───────────────────────────────
  'iam-config': {
    name: 'Keycloak',
    githubUrl: 'https://github.com/keycloak/keycloak',
    description: 'Open source identity and access management with SSO, LDAP, and social login',
    status: 'available',
    secuhubUrl: 'https://secuhub.io/tool/iam-config',
    license: 'Apache-2.0',
    stars: 23200,
  },

  // ─── Cloud Security ──────────────────────────────────
  'cloud-security': {
    name: 'Prowler',
    githubUrl: 'https://github.com/prowler-cloud/prowler',
    description: 'Open source security tool for AWS, Azure, and GCP best practices compliance',
    status: 'available',
    secuhubUrl: 'https://secuhub.io/tool/cloud-security',
    license: 'Apache-2.0',
    stars: 14200,
  },

  // ─── Contract Review ─────────────────────────────────
  'contract-review': {
    name: 'SecuClaw AI',
    githubUrl: '',
    description: 'AI-powered security clause review and compliance gap detection for contracts',
    status: 'coming-soon',
    secuhubUrl: 'https://secuhub.io/tool/contract-review',
  },

  // ─── Third Party Risk ────────────────────────────────
  'third-party-risk': {
    name: 'SecuClaw AI',
    githubUrl: '',
    description: 'Third-party risk assessment with supply chain attack surface analysis',
    status: 'coming-soon',
    secuhubUrl: 'https://secuhub.io/tool/third-party-risk',
  },

  // ─── New tools (v3 expansion to 35) ──────────────────

  /** Cookie compliance management and consent tracking */
  'cookie-mgmt': {
    name: 'SecuClaw AI',
    githubUrl: '',
    description: 'Cookie banner management and compliance monitoring for GDPR/ePrivacy',
    status: 'coming-soon',
    secuhubUrl: 'https://secuhub.io/tool/cookie-mgmt',
  },

  /** Consent management platform for data subject preferences */
  'consent-mgmt': {
    name: 'SecuClaw AI',
    githubUrl: '',
    description: 'User consent collection, storage, and lifecycle management platform',
    status: 'coming-soon',
    secuhubUrl: 'https://secuhub.io/tool/consent-mgmt',
  },

  /** Data Processing Agreement management and tracking */
  'dpa-mgmt': {
    name: 'SecuClaw AI',
    githubUrl: '',
    description: 'DPA lifecycle management with automated compliance checking',
    status: 'coming-soon',
    secuhubUrl: 'https://secuhub.io/tool/dpa-mgmt',
  },

  /** SLA compliance monitoring and breach tracking */
  'sla-mgmt': {
    name: 'SecuClaw AI',
    githubUrl: '',
    description: 'Service Level Agreement tracking with breach detection and reporting',
    status: 'coming-soon',
    secuhubUrl: 'https://secuhub.io/tool/sla-mgmt',
  },

  /** Supply chain intelligence and vulnerability tracking */
  'supply-intel': {
    name: 'OSV.dev',
    githubUrl: 'https://github.com/google/osv.dev',
    description: 'Open source vulnerability database and SBOM-based vulnerability scanning',
    status: 'available',
    secuhubUrl: 'https://secuhub.io/tool/supply-intel',
    license: 'Apache-2.0',
    stars: 7200,
  },
};

/** Get stats about open source tool availability */
export function getOpenSourceStats() {
  const entries = Object.values(OPEN_SOURCE_TOOLS);
  const available = entries.filter(e => e.status === 'available').length;
  const comingSoon = entries.filter(e => e.status === 'coming-soon').length;
  return { total: entries.length, available, comingSoon };
}
