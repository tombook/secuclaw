import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { gatewayClient } from '../gateway-client.js';
import { roleContext } from '../store/role-context.js';
import '../components/design-system/sc-button.js';
import '../components/design-system/sc-card.js';
import '../components/design-system/sc-badge.js';
import '../components/sc-smart-recommendation-bar.js';

interface Skill {
  id: string;
  name: string;
  nameEn?: string;
  icon: string;
  category: string;
  subcategory?: string;
  description: string;
  descriptionEn?: string;
  version: string;
  author: string;
  type: 'opensource' | 'commercial' | 'saas';
  installed: boolean;
  rating: number;
  downloads: number;
  apiEndpoint?: string;
  apiAuth?: string;
  mitreCoverage?: string[];
  capabilities?: string[];
  // 技能出处信息
  sources?: {
    homepage?: string;
    api_doc?: string;
    github?: string;
    pricing?: string;
    api_type?: string;
  };
}

@customElement('sc-skills-market')
export class ScSkillsMarket extends LitElement {
  @state() private selectedSkill: Skill | null = null;
  @state() private activeFilter = 'all';
  @state() private toastMessage = '';
  @state() private toastType: 'success' | 'error' | 'info' = 'info';
  private toastTimeout: number | null = null;
  @state() private serverSkills: any[] = [];
  @state() private loadingFromServer = false;

  connectedCallback() {
    super.connectedCallback();
    this.loadInstalledSkills();
    this.loadServerSkills();
  }

  private loadInstalledSkills(): void {
    try {
      const stored = localStorage.getItem('secuclaw-installed-skills');
      if (stored) {
        const installedIds = JSON.parse(stored) as string[];
        this.coreSkills = this.coreSkills.map(s => ({
          ...s,
          installed: installedIds.includes(s.id) || s.installed
        }));
        this.securityTools = this.securityTools.map(s => ({
          ...s,
          installed: installedIds.includes(s.id)
        }));
      }
    } catch (e) {
      console.warn('[skills-market] Failed to load installed skills:', e);
    }
  }

  private saveInstalledSkills(): void {
    const installedIds = [
      ...this.coreSkills.filter(s => s.installed).map(s => s.id),
      ...this.securityTools.filter(s => s.installed).map(s => s.id)
    ];
    localStorage.setItem('secuclaw-installed-skills', JSON.stringify(installedIds));
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = window.setTimeout(() => { this.toastMessage = ''; }, 3000);
  }


  private async loadServerSkills(): Promise<void> {
    this.loadingFromServer = true;
    try {
      const res = await gatewayClient.request('skills.list', {});
      const data = res as Record<string, any> | null;
      if (data && typeof data === 'object') {
        this.serverSkills = Object.values(data).filter((s: any) => s && typeof s === 'object' && s.id);
      }
    } catch (e) {
      console.warn('[SkillsMarket] Failed to load server skills:', e);
    }
    this.loadingFromServer = false;
  }

  // Sources map from SKILL.md files
  private sourcesMap: Record<string, any> = {
    'virustotal': {"homepage": "https://www.virustotal.com", "api_doc": "https://developers.virustotal.com/reference", "github": "https://github.com/VirusTotal/vt-api", "pricing": "免费版500次/天 | 付费版$15/月起", "api_type": "API Key"},
    'shodan': {"homepage": "https://www.shodan.io", "api_doc": "https://developer.shodan.io/api", "pricing": "免费版100次/月 | 付费版$59/月起", "api_type": "API Key"},
    'nmap': {"homepage": "https://nmap.org", "api_doc": "https://nmap.org/book/man.html", "github": "https://github.com/nmap/nmap", "pricing": "开源免费", "api_type": "CLI工具"},
    'metasploit': {"homepage": "https://www.metasploit.com", "api_doc": "https://docs.metasploit.com/api", "github": "https://github.com/rapid7/metasploit-framework", "pricing": "社区版免费 | 专业版$2,000/年", "api_type": "REST API + CLI"},
    'openvas': {"homepage": "https://www.greenbone.net/", "api_doc": "https://docs.greenbone.net/API/", "github": "https://github.com/greenbone/openvas", "pricing": "开源免费", "api_type": "REST API"},
    'elastic': {"homepage": "https://www.elastic.co/security", "api_doc": "https://www.elastic.co/guide/index.html", "github": "https://github.com/elastic/elasticsearch", "pricing": "基础版免费 | 付费版$95/月起", "api_type": "REST API"},
    'wazuh': {"homepage": "https://wazuh.com", "api_doc": "https://documentation.wazuh.com/current/user-manual/api/index.html", "github": "https://github.com/wazuh/wazuh", "pricing": "开源免费", "api_type": "REST API"},
    'splunk': {"homepage": "https://www.splunk.com", "api_doc": "https://docs.splunk.com/Documentation/Splunk/latest/RESTTUT/RESTandPython", "pricing": "免费版500MB/天 | 付费版$150/月起", "api_type": "REST API + SPL"},
    'crowdstrike': {"homepage": "https://www.crowdstrike.com", "api_doc": "https://falcon.us-2.crowdstrike.com/api/documentation/", "pricing": "$20/终端/月起", "api_type": "OAuth2 API"},
    'sentinelone': {"homepage": "https://www.sentinelone.com", "api_doc": "https://integrations.sentinelone.net/", "pricing": "$8/终端/月起", "api_type": "REST API"},
    'nessus': {"homepage": "https://www.tenable.com/products/nessus", "api_doc": "https://developer.tenable.com/", "pricing": "专业版$2,190/年", "api_type": "REST API"},
    'qualys': {"homepage": "https://www.qualys.com", "api_doc": "https://www.qualys.com/docs/qualys-api.pdf", "pricing": "企业定价", "api_type": "REST API"},
    'burp-suite': {"homepage": "https://portswigger.net/burp", "api_doc": "https://portswigger.net/burp/documentation", "pricing": "$449/年", "api_type": "REST API"},
    'sqlmap': {"homepage": "https://sqlmap.org", "api_doc": "https://github.com/sqlmapproject/sqlmap/wiki", "github": "https://github.com/sqlmapproject/sqlmap", "pricing": "开源免费", "api_type": "CLI"},
    'nuclei': {"homepage": "https://nuclei.projectdiscovery.io", "api_doc": "https://github.com/projectdiscovery/nuclei", "github": "https://github.com/projectdiscovery/nuclei", "pricing": "开源免费 | Nuclei Cloud $20/月", "api_type": "CLI + REST API"},
    'owasp-zap': {"homepage": "https://www.zaproxy.org", "api_doc": "https://www.zaproxy.org/docs/api/", "github": "https://github.com/zaproxy/zaproxy", "pricing": "开源免费", "api_type": "REST API + CLI"},
    'trivy': {"homepage": "https://trivy.dev", "api_doc": "https://aquasecurity.github.io/trivy/latest/docs/", "github": "https://github.com/aquasecurity/trivy", "pricing": "开源免费", "api_type": "CLI"},
    'snyk': {"homepage": "https://snyk.io", "api_doc": "https://docs.snyk.io/snyk-api", "github": "https://github.com/snyk/snyk", "pricing": "免费版100次/周 | 付费版$25/月起", "api_type": "REST API + CLI"},
    'sonarqube': {"homepage": "https://sonarsource.com", "api_doc": "https://sonarsource.com/go-academy/technical-article-sonarqube-web-api/", "github": "https://github.com/SonarSource/sonarqube", "pricing": "社区版免费 | 付费版€10/月起", "api_type": "REST API"},
    'misp': {"homepage": "https://www.misp-project.org", "api_doc": "https://www.misp-project.org/openapi/", "github": "https://github.com/MISP/MISP", "pricing": "开源免费", "api_type": "REST API"},
    'opencti': {"homepage": "https://www.opencti.io", "api_doc": "https://api.opencti.io/", "github": "https://github.com/OpenCTI-Platform/opencti", "pricing": "开源免费", "api_type": "GraphQL API"},
    'greynoise': {"homepage": "https://greynoise.io", "api_doc": "https://docs.greynoise.io/", "github": "https://github.com/GreyNoise-Intelligence", "pricing": "免费版1,000次/月 | 付费版$99/月起", "api_type": "REST API"},
    'suricata': {"homepage": "https://suricata.io", "api_doc": "https://suricata.readthedocs.io/", "github": "https://github.com/OISF/suricata", "pricing": "开源免费", "api_type": "CLI + Eve JSON"},
    'zeek': {"homepage": "https://zeek.org", "api_doc": "https://docs.zeek.org/en/current/scripting/", "github": "https://github.com/zeek/zeek", "pricing": "开源免费", "api_type": "CLI + Broker"},
    'okta': {"homepage": "https://www.okta.com", "api_doc": "https://developer.okta.com/docs/reference/", "pricing": "免费版1,000 MAU | 付费版$0.75/MAU起", "api_type": "REST API + OAuth2"},
    'vault': {"homepage": "https://www.vaultproject.io", "api_doc": "https://developer.hashicorp.com/vault/api", "github": "https://github.com/hashicorp/vault", "pricing": "开源免费 | 云版$0.026/MAU起", "api_type": "REST API"},
    'proofpoint': {"homepage": "https://www.proofpoint.com", "api_doc": "https://proofpoint.com/us/platform-api", "pricing": "企业定价", "api_type": "REST API"},
    'thehive': {"homepage": "https://thehive-project.org", "api_doc": "https://docs.thehive-project.org/thaleaf/api/", "github": "https://github.com/TheHive-Project/TheHive", "pricing": "开源免费", "api_type": "REST API"},
    'sysdig': {"homepage": "https://sysdig.com", "api_doc": "https://docs.sysdig.com/", "github": "https://github.com/sysdiglabs/sysdig", "pricing": "免费版 | 付费版$20/月起", "api_type": "REST API"},
    'aqua-security': {"homepage": "https://www.aquasec.com", "api_doc": "https://docs.aquasec.com/", "github": "https://github.com/aquasecurity", "pricing": "按容器计费", "api_type": "REST API"},
    'prisma-cloud': {"homepage": "https://www.paloaltonetworks.com/prisma/cloud", "api_doc": "https://prisma.paloaltonetworks.com/api/", "pricing": "企业定价", "api_type": "REST API"},
    'wiz': {"homepage": "https://www.wiz.io", "api_doc": "https://www.wiz.io/doc/overview", "pricing": "企业定价", "api_type": "GraphQL API"},
    'aws-security-hub': {"homepage": "https://aws.amazon.com/security-hub", "api_doc": "https://docs.aws.amazon.com/security-hub/", "pricing": "按发现数计费", "api_type": "AWS REST API"},
    'cloudflare': {"homepage": "https://www.cloudflare.com", "api_doc": "https://developers.cloudflare.com/api/", "pricing": "免费版 | 付费版$20/月起", "api_type": "REST API + GraphQL"},
    'microsoft-defender': {"homepage": "https://www.microsoft.com/security", "api_doc": "https://learn.microsoft.com/en-us/microsoft-365/security/defender/", "pricing": "M365 E5包含", "api_type": "Microsoft Graph API"},
    'jamf': {"homepage": "https://www.jamf.com", "api_doc": "https://developer.jamf.com/", "pricing": "$4/设备/月起", "api_type": "REST API"},
    'yara': {"homepage": "https://virustotal.github.io/yara", "api_doc": "https://yaraproduction.readthedocs.io/", "github": "https://github.com/VirusTotal/yara", "pricing": "开源免费", "api_type": "CLI + Python库"},
    'volatility': {"homepage": "https://www.volatilityfoundation.org", "api_doc": "https://volatility3.readthedocs.io/", "github": "https://github.com/volatilityfoundation/volatility3", "pricing": "开源免费", "api_type": "CLI + Python"},
    'wireshark': {"homepage": "https://wireshark.org", "api_doc": "https://www.wireshark.org/docs/", "github": "https://github.com/wireshark/wireshark", "pricing": "开源免费", "api_type": "CLI (tshark)"},
    'autopsy': {"homepage": "https://www.autopsy.com", "api_doc": "https://hub.docker.com/r/autopsy/autopsy", "github": "https://github.com/sleuthkit/autopsy", "pricing": "开源免费", "api_type": "CLI + Python"},
    'bloodhound': {"homepage": "https://github.com/BloodHoundAD", "api_doc": "https://bloodhound.readthedocs.io/", "github": "https://github.com/BloodHoundAD/BloodHound", "pricing": "开源免费", "api_type": "CLI + Neo4j"},
    'hashcat': {"homepage": "https://hashcat.net", "api_doc": "https://hashcat.net/wiki/", "github": "https://github.com/hashcat/hashcat", "pricing": "开源免费", "api_type": "CLI"},
    'hydra': {"homepage": "https://github.com/vanhauser-thc/thc-hydra", "api_doc": "https://github.com/vanhauser-thc/thc-hydra", "github": "https://github.com/vanhauser-thc/thc-hydra", "pricing": "开源免费", "api_type": "CLI"},
    'john': {"homepage": "https://www.openwall.com/john", "api_doc": "https://www.openwall.com/john/doc/", "github": "https://github.com/openwall/john", "pricing": "开源免费", "api_type": "CLI"},
    'nikto': {"homepage": "https://cirt.net/Nikto2", "api_doc": "https://github.com/sullo/nikto/wiki", "github": "https://github.com/sullo/nikto", "pricing": "开源免费", "api_type": "CLI"},
    'gobuster': {"homepage": "https://github.com/OJ/gobuster", "api_doc": "https://github.com/OJ/gobuster", "github": "https://github.com/OJ/gobuster", "pricing": "开源免费", "api_type": "CLI"},
    'ffuf': {"homepage": "https://github.com/ffuf/ffuf", "api_doc": "https://github.com/ffuf/ffuf", "github": "https://github.com/ffuf/ffuf", "pricing": "开源免费", "api_type": "CLI"},
    'wpscan': {"homepage": "https://wpscan.com", "api_doc": "https://wpscan.com/documentation", "github": "https://github.com/wpscanteam/wpscan", "pricing": "免费版无限制 | API $65/月起", "api_type": "CLI + REST API"},
    'commix': {"homepage": "https://github.com/commixproject/commix", "api_doc": "https://github.com/commixproject/commix", "github": "https://github.com/commixproject/commix", "pricing": "开源免费", "api_type": "CLI"},
    'xsstrike': {"homepage": "https://github.com/s0md3v/XSStrike", "api_doc": "https://github.com/s0md3v/XSStrike", "github": "https://github.com/s0md3v/XSStrike", "pricing": "开源免费", "api_type": "CLI (Python)"},
    'ssrfmap': {"homepage": "https://github.com/swisskyrepo/SSRFmap", "api_doc": "https://github.com/swisskyrepo/SSRFmap", "github": "https://github.com/swisskyrepo/SSRFmap", "pricing": "开源免费", "api_type": "CLI (Python)"},
    'responder': {"homepage": "https://github.com/SpiderLabs/Responder", "api_doc": "https://github.com/SpiderLabs/Responder", "github": "https://github.com/SpiderLabs/Responder", "pricing": "开源免费", "api_type": "CLI"},
    'crackmapexec': {"homepage": "https://github.com/PorLaCola25/CrackMapExec", "api_doc": "https://github.com/PorLaCola25/CrackMapExec", "github": "https://github.com/PorLaCola25/CrackMapExec", "pricing": "开源免费", "api_type": "CLI"},
    'rubeus': {"homepage": "https://github.com/GhostPack/Rubeus", "api_doc": "https://github.com/GhostPack/Rubeus", "github": "https://github.com/GhostPack/Rubeus", "pricing": "开源免费", "api_type": "CLI (.NET)"},
    'mimikatz': {"homepage": "https://github.com/gentilkiwi/mimikatz", "api_doc": "https://github.com/gentilkiwi/mimikatz/wiki", "github": "https://github.com/gentilkiwi/mimikatz", "pricing": "开源免费", "api_type": "CLI (Windows)"},
    'empire': {"homepage": "https://github.com/BC-SECURITY/Empire", "api_doc": "https://github.com/BC-SECURITY/Empire", "github": "https://github.com/BC-SECURITY/Empire", "pricing": "开源免费", "api_type": "REST API + CLI"},
    'cobalt-strike': {"homepage": "https://www.cobaltstrike.com", "api_doc": "https://www.cobaltstrike.com/documentation", "pricing": "$3,500/年", "api_type": "Aggressor Script + REST API"},
    'evil-winrm': {"homepage": "https://github.com/Hackplayers/evil-winrm", "api_doc": "https://github.com/Hackplayers/evil-winrm", "github": "https://github.com/Hackplayers/evil-winrm", "pricing": "开源免费", "api_type": "CLI (Ruby)"},
    'impacket': {"homepage": "https://github.com/fortra/impacket", "api_doc": "https://github.com/fortra/impacket", "github": "https://github.com/fortra/impacket", "pricing": "开源免费", "api_type": "Python库"},
    'amass': {"homepage": "https://github.com/OWASP/Amass", "api_doc": "https://github.com/OWASP/Amass", "github": "https://github.com/OWASP/Amass", "pricing": "开源免费", "api_type": "CLI"},
    'subfinder': {"homepage": "https://github.com/projectdiscovery/subfinder", "api_doc": "https://github.com/projectdiscovery/subfinder", "github": "https://github.com/projectdiscovery/subfinder", "pricing": "开源免费", "api_type": "CLI"},
    'masscan': {"homepage": "https://github.com/robertdavidgraham/masscan", "api_doc": "https://github.com/robertdavidgraham/masscan", "github": "https://github.com/robertdavidgraham/masscan", "pricing": "开源免费", "api_type": "CLI"},
    'netcat': {"homepage": "http://nc110.sourceforge.net", "api_doc": "http://nc110.sourceforge.net/", "pricing": "开源免费", "api_type": "CLI"},
    'bandit': {"homepage": "https://bandit.readthedocs.io", "api_doc": "https://bandit.readthedocs.io/", "github": "https://github.com/PyCQA/bandit", "pricing": "开源免费", "api_type": "CLI (Python)"},
    'safety': {"homepage": "https://pyup.io/safety/", "api_doc": "https://pyup.io/safety/", "github": "https://github.com/pyupio/safety", "pricing": "免费版有限 | 付费版$299/月起", "api_type": "CLI + REST API"},
    'mobsf': {"homepage": "https://github.com/MobSF", "api_doc": "https://github.com/MobSF/MobSF/wiki", "github": "https://github.com/MobSF/MobSF", "pricing": "开源免费", "api_type": "REST API"},
    'osquery': {"homepage": "https://osquery.io", "api_doc": "https://osquery.readthedocs.io/", "github": "https://github.com/osquery/osquery", "pricing": "开源免费", "api_type": "CLI + Thrift API"},
    'openscap': {"homepage": "https://www.open-scap.org", "api_doc": "https://www.open-scap.org/resources/documentation/", "github": "https://github.com/OpenSCAP/openSCAP", "pricing": "开源免费", "api_type": "CLI"},
    'graylog': {"homepage": "https://www.graylog.org", "api_doc": "https://docs.graylog.org/", "github": "https://github.com/Graylog2/graylog2-server", "pricing": "开源免费 | 企业版定价", "api_type": "REST API"},
    'qradar': {"homepage": "https://www.ibm.com/qradar", "api_doc": "https://www.ibm.com/docs/en/qradar-common", "pricing": "企业定价", "api_type": "REST API + AQL"},
    'palo-alto': {"homepage": "https://www.paloaltonetworks.com", "api_doc": "https://docs.paloaltonetworks.com/pan-os/11-0/pan-os-panorama-api", "pricing": "硬件/VM定价", "api_type": "REST API + XML API"},
    'fortinet': {"homepage": "https://www.fortinet.com", "api_doc": "https://docs.fortinet.com/fortigate/70doc/dita/fortigate-70-odocs.pdf", "pricing": "硬件/VM定价", "api_type": "REST API"},
    'imperva': {"homepage": "https://www.imperva.com", "api_doc": "https://docs.imperva.com/", "pricing": "企业定价", "api_type": "REST API"},
    'checkmarx': {"homepage": "https://checkmarx.com", "api_doc": "https://checkmarx.atlassian.net/wiki/spaces/KC/overview", "pricing": "企业定价", "api_type": "REST API"},
    'veracode': {"homepage": "https://www.veracode.com", "api_doc": "https://docs.veracode.com/", "pricing": "按扫描计费", "api_type": "REST API"},
    'tenable': {"homepage": "https://www.tenable.com", "api_doc": "https://developer.tenable.com/", "pricing": "$2,500/年起", "api_type": "REST API"},
    'cyberark': {"homepage": "https://www.cyberark.com", "api_doc": "https://docs.cyberark.com/", "pricing": "企业定价", "api_type": "REST API + PVWA"},
    'mimecast': {"homepage": "https://www.mimecast.com", "api_doc": "https://www.mimecast.com/developers/", "pricing": "按用户计费", "api_type": "REST API"},
    'abnormal-security': {"homepage": "https://abnormal.ai", "api_doc": "https://api.abnormal.ai/", "pricing": "企业定价", "api_type": "REST API"},
    'dirb': {"homepage": "https://github.com/v0re/dirb", "api_doc": "https://github.com/v0re/dirb", "github": "https://github.com/v0re/dirb", "pricing": "开源免费", "api_type": "CLI"},
    'whatweb': {"homepage": "https://github.com/urbanadventurer/WhatWeb", "api_doc": "https://github.com/urbanadventurer/WhatWeb", "github": "https://github.com/urbanadventurer/WhatWeb", "pricing": "开源免费", "api_type": "CLI"},
    'raccoon': {"homepage": "https://github.com/evyatarmeged/Raccoon", "api_doc": "https://github.com/evyatarmeged/Raccoon", "github": "https://github.com/evyatarmeged/Raccoon", "pricing": "开源免费", "api_type": "CLI"},
    'keethief': {"homepage": "https://github.com/GhostPack/KeeThief", "api_doc": "https://github.com/GhostPack/KeeThief", "github": "https://github.com/GhostPack/KeeThief", "pricing": "开源免费", "api_type": "PowerShell"},
  };

  private getSources(skillId: string): any {
    // Try exact match first
    if (this.sourcesMap[skillId]) {
      return this.sourcesMap[skillId];
    }
    
    // Try matching by removing common suffixes
    const suffixes = ['-siem', '-falcon', '-intel', '-es', '-pro', '-enterprise', '-ngfw', '-waf', '-vm', '-container', '-security', '-soar'];
    for (const suffix of suffixes) {
      if (skillId.endsWith(suffix)) {
        const baseId = skillId.slice(0, -suffix.length);
        if (this.sourcesMap[baseId]) {
          return this.sourcesMap[baseId];
        }
      }
    }
    
    // Try matching by removing prefix
    const prefixes = ['ibm-', 'aws-', 'azure-', 'microsoft-', 'palo-alto-', 'qualys-', 'tenable-', 'fortinet-', 'cloudflare-', 'imperva-'];
    for (const prefix of prefixes) {
      if (skillId.startsWith(prefix)) {
        const baseId = skillId.slice(prefix.length);
        if (this.sourcesMap[baseId]) {
          return this.sourcesMap[baseId];
        }
      }
    }
    
    return null;
  }

  // Original skills
  private coreSkills: Skill[] = [
    { id: 'threat-analyst', name: '威胁分析师', icon: '🎯', category: 'core', description: '基于MITRE ATT&CK框架分析威胁情报，生成威胁评估报告', version: '2.1.0', author: 'SecuClaw Team', type: 'opensource', installed: true, rating: 4.8, downloads: 1250 },
    { id: 'vuln-triage', name: '漏洞分诊专家', icon: '🔍', category: 'core', description: '自动对漏洞进行CVSS评分、资产关联和修复优先级排序', version: '1.8.2', author: 'SecuClaw Team', type: 'opensource', installed: true, rating: 4.6, downloads: 980 },
    { id: 'compliance-checker', name: '合规检查员', icon: '✅', category: 'core', description: '自动检查安全配置是否符合CIS/NIST/SCF标准', version: '3.0.1', author: 'SecuClaw Team', type: 'opensource', installed: true, rating: 4.9, downloads: 1560 },
    { id: 'incident-responder', name: '事件响应助手', icon: '🚨', category: 'core', description: '辅助安全事件分析、分类和响应建议生成', version: '1.5.0', author: 'SecuClaw Team', type: 'opensource', installed: false, rating: 4.5, downloads: 720 },
    { id: 'pentest-planner', name: '渗透测试规划师', icon: '⚔️', category: 'core', description: '根据目标环境自动生成渗透测试方案和攻击路径', version: '1.2.0', author: 'Community', type: 'opensource', installed: false, rating: 4.3, downloads: 450 },
    { id: 'risk-assessor', name: '风险评估师', icon: '📊', category: 'core', description: '量化安全风险、生成风险热图和缓解建议', version: '2.0.0', author: 'SecuClaw Team', type: 'opensource', installed: false, rating: 4.7, downloads: 890 },
    { id: 'report-generator', name: '报告生成器', icon: '📄', category: 'core', description: '自动生成符合高管、技术、合规不同视角的安全报告', version: '1.9.1', author: 'SecuClaw Team', type: 'opensource', installed: true, rating: 4.4, downloads: 1100 },
    { id: 'asset-discovery', name: '资产发现器', icon: '🖥️', category: 'core', description: '自动发现和分类组织IT资产，跟踪资产变更', version: '1.3.0', author: 'Community', type: 'opensource', installed: false, rating: 4.2, downloads: 380 },
  ];

  // Security tools catalog (100+ tools)
  private securityTools: Skill[] = [
    // ==================== 漏洞扫描与评估 (10) ====================
    { id: 'openvas', name: 'OpenVAS', icon: '🔴', category: 'vuln-scan', subcategory: 'opensource', nameEn: 'OpenVAS', description: '开源漏洞扫描器，支持资产发现、漏洞检测、配置审计', version: '22.4.0', author: 'Greenbone', type: 'opensource', installed: false, rating: 4.5, downloads: 3200, apiEndpoint: 'https://openvas-host:9390/api', apiAuth: 'Token', mitreCoverage: ['T1046', 'T1499'] },
    { id: 'nessus', name: 'Tenable Nessus', icon: '🔵', category: 'vuln-scan', subcategory: 'commercial', nameEn: 'Nessus', description: '商业漏洞扫描，支持Web应用扫描、合规检查、配置审计', version: '10.6.0', author: 'Tenable', type: 'commercial', installed: false, rating: 4.7, downloads: 5600, apiEndpoint: 'https://nessus-host:8834/api/v2', apiAuth: 'Access Key/Secret Key', mitreCoverage: ['T1046', 'T1499'] },
    { id: 'qualys-vm', name: 'Qualys VMDR', icon: '🟢', category: 'vuln-scan', subcategory: 'saas', nameEn: 'Qualys VMDR', description: '云端漏洞管理，支持资产发现、补丁管理、漏洞追踪', version: '3.0', author: 'Qualys', type: 'saas', installed: false, rating: 4.6, downloads: 4100, apiEndpoint: 'https://qualysapi.qualys.com/api/2.0/fo/', apiAuth: 'API Token', mitreCoverage: ['T1046'] },
    { id: 'tenable-io', name: 'Tenable.io', icon: '☁️', category: 'vuln-scan', subcategory: 'saas', nameEn: 'Tenable.io', description: '云漏洞管理平台，支持容器扫描、云资产发现', version: '2024.1', author: 'Tenable', type: 'saas', installed: false, rating: 4.5, downloads: 3800, apiEndpoint: 'https://cloud.tenable.com/api/v4.0', apiAuth: 'Access Key/Secret Key', mitreCoverage: ['T1046'] },
    { id: 'rapid7-insightvm', name: 'Rapid7 InsightVM', icon: '🔶', category: 'vuln-scan', subcategory: 'commercial', nameEn: 'InsightVM', description: '实时漏洞管理，支持风险评分、修复优先级', version: '6.5', author: 'Rapid7', type: 'commercial', installed: false, rating: 4.4, downloads: 2100, apiEndpoint: 'https://InsightVM-Host:37893/api/3', apiAuth: 'Session Token', mitreCoverage: ['T1046', 'T1499'] },
    { id: 'openscap', name: 'OpenSCAP', icon: '🛡️', category: 'vuln-scan', subcategory: 'opensource', nameEn: 'OpenSCAP', description: '开源配置核查工具，支持SCAP标准合规检查', version: '1.3.8', author: 'Red Hat', type: 'opensource', installed: false, rating: 4.2, downloads: 1800, apiEndpoint: 'CLI工具', apiAuth: '无', mitreCoverage: ['T1046'] },
    { id: 'gvm', name: 'GVM', icon: '🟢', category: 'vuln-scan', subcategory: 'opensource', nameEn: 'Greenbone Vulnerability Management', description: '开源漏洞管理系统，支持威胁情报、资产关联', version: '22.4', author: 'Greenbone', type: 'opensource', installed: false, rating: 4.3, downloads: 1500, apiEndpoint: 'https://gvmd-host:9390/api', apiAuth: 'Token', mitreCoverage: ['T1046'] },
    { id: 'tripwire-ip360', name: 'Tripwire IP360', icon: '🔒', category: 'vuln-scan', subcategory: 'commercial', nameEn: 'Tripwire IP360', description: '配置评估、文件完整性监控、漏洞关联', version: '10.0', author: 'Tripwire', type: 'commercial', installed: false, rating: 4.1, downloads: 980, apiEndpoint: 'https://tripwire-host:7443/api/v1/', apiAuth: 'API Token', mitreCoverage: ['T1036', 'T1041'] },
    { id: 'qualys-container', name: 'Qualys Container Security', icon: '📦', category: 'vuln-scan', subcategory: 'saas', nameEn: 'Qualys Container Security', description: '容器镜像扫描、Kubernetes审计、运行时保护', version: '2.0', author: 'Qualys', type: 'saas', installed: false, rating: 4.3, downloads: 1200, apiEndpoint: 'https://container-security.qualys.com/api/v2.0/', apiAuth: 'OAuth 2.0', mitreCoverage: ['T1525', 'T1611'] },
    { id: 'tenable-nessus-expert', name: 'Nessus Expert', icon: '⭐', category: 'vuln-scan', subcategory: 'commercial', nameEn: 'Tenable Nessus Expert', description: 'Web应用扫描、供应链审查、Developer Env扫描', version: '10.6', author: 'Tenable', type: 'commercial', installed: false, rating: 4.6, downloads: 2400, apiEndpoint: 'https://nessus-host:8834/api', apiAuth: 'Access Key/Secret Key', mitreCoverage: ['T1046'] },

    // ==================== 威胁情报平台 (10) ====================
    { id: 'misp', name: 'MISP', icon: '🧠', category: 'threat-intel', subcategory: 'opensource', nameEn: 'Malware Information Sharing Platform', description: '威胁情报共享平台，支持IOC存储、属性分析、Galaxies', version: '3.0', author: 'MISP Project', type: 'opensource', installed: false, rating: 4.7, downloads: 2800, apiEndpoint: 'https://misp-host/api/v2/', apiAuth: 'Auth Key', mitreCoverage: ['T1040', 'T1053'] },
    { id: 'opencti', name: 'OpenCTI', icon: '🔗', category: 'threat-intel', subcategory: 'opensource', nameEn: 'Open Cyber Threat Intelligence', description: '威胁情报管理平台，支持知识图谱、动态分析', version: '6.0', author: 'Filigran', type: 'opensource', installed: false, rating: 4.6, downloads: 1900, apiEndpoint: 'https://opencti-host/graphql', apiAuth: 'Bearer Token', mitreCoverage: ['T1040'] },
    { id: 'virustotal', name: 'VirusTotal', icon: '🦠', category: 'threat-intel', subcategory: 'saas', nameEn: 'VirusTotal', description: '文件/URL分析、IP域名查询、关系图谱', version: 'v3', author: 'Google', type: 'saas', installed: false, rating: 4.8, downloads: 8900, apiEndpoint: 'https://www.virustotal.com/api/v3/', apiAuth: 'API Key', mitreCoverage: ['T1105', 'T1071'] },
    { id: 'shodan', name: 'Shodan', icon: '🌐', category: 'threat-intel', subcategory: 'saas', nameEn: 'Shodan', description: '网络空间测绘、设备搜索、漏洞搜索', version: 'v2', author: 'Shodan', type: 'saas', installed: false, rating: 4.7, downloads: 4500, apiEndpoint: 'https://api.shodan.io/api/v2.0/', apiAuth: 'API Key', mitreCoverage: ['T1046', 'T1595'] },
    { id: 'alienvault-otx', name: 'AlienVault OTX', icon: '🌪️', category: 'threat-intel', subcategory: 'opensource', nameEn: 'Open Threat Exchange', description: '脉冲订阅、IOC查询、地理情报', version: 'v2', author: 'AT&T', type: 'opensource', installed: false, rating: 4.4, downloads: 2100, apiEndpoint: 'https://otx.alienvault.com/api/v1/', apiAuth: 'API Key', mitreCoverage: ['T1040'] },
    { id: 'greynoise', name: 'GreyNoise', icon: '🌫️', category: 'threat-intel', subcategory: 'saas', nameEn: 'GreyNoise', description: '互联网背景噪音分析、威胁分类、IP信誉', version: 'v4', author: 'GreyNoise', type: 'saas', installed: false, rating: 4.5, downloads: 1600, apiEndpoint: 'https://api.greynoise.io/v4/', apiAuth: 'API Key', mitreCoverage: ['T1040'] },
    { id: 'recorded-future', name: 'Recorded Future', icon: '🔮', category: 'threat-intel', subcategory: 'commercial', nameEn: 'Recorded Future', description: '威胁情报分析、风险评分、漏洞预测', version: 'v2', author: 'Recorded Future', type: 'commercial', installed: false, rating: 4.8, downloads: 1200, apiEndpoint: 'https://api.recordedfuture.com/v2/', apiAuth: 'API Token', mitreCoverage: ['T1040'] },
    { id: 'crowdstrike-intel', name: 'CrowdStrike Intelligence', icon: '🦅', category: 'threat-intel', subcategory: 'commercial', nameEn: 'CrowdStrike Threat Intelligence', description: '威胁情报订阅、攻击者画像、MITRE映射', version: 'v2', author: 'CrowdStrike', type: 'commercial', installed: false, rating: 4.7, downloads: 1800, apiEndpoint: 'https://api.crowdstrike.com/intel/graphql', apiAuth: 'Client ID/Secret', mitreCoverage: ['T1040'] },
    { id: 'threatconnect', name: 'ThreatConnect', icon: '🔗', category: 'threat-intel', subcategory: 'commercial', nameEn: 'ThreatConnect', description: '威胁情报分析、编排自动化、第三方集成', version: 'v3', author: 'ThreatConnect', type: 'commercial', installed: false, rating: 4.5, downloads: 980, apiEndpoint: 'https://app.threatconnect.com/api/v3/', apiAuth: 'API Token', mitreCoverage: ['T1040', 'T1053'] },
    { id: 'abuse-ch', name: 'Abuse.ch Feefty', icon: '🚨', category: 'threat-intel', subcategory: 'opensource', nameEn: 'Abuse.ch Feefty', description: '恶意软件追踪、URL分析、主机信息', version: 'v1', author: 'Abuse.ch', type: 'opensource', installed: false, rating: 4.6, downloads: 2400, apiEndpoint: 'https://feefly.io/api/v1/', apiAuth: 'API Key', mitreCoverage: ['T1102', 'T1071'] },

    // ==================== 渗透测试与红队 (11) ====================
    { id: 'metasploit', name: 'Metasploit Framework', icon: '💀', category: 'pentest', subcategory: 'opensource', nameEn: 'Metasploit', description: '漏洞利用框架、模块开发、后渗透测试', version: '6.3', author: 'Rapid7', type: 'opensource', installed: false, rating: 4.8, downloads: 6200, apiEndpoint: 'https://msf-host:3790/api/v1/', apiAuth: 'Bearer Token', mitreCoverage: ['T1053', 'T1068'] },
    { id: 'burp-suite', name: 'Burp Suite Professional', icon: '🌍', category: 'pentest', subcategory: 'commercial', nameEn: 'Burp Suite Pro', description: 'Web应用渗透测试、漏洞扫描、Intruder攻击', version: '2024.1', author: 'PortSwigger', type: 'commercial', installed: false, rating: 4.9, downloads: 4800, apiEndpoint: 'http://burp-host:1337/v0.1/', apiAuth: 'API Key', mitreCoverage: ['T1053', 'T1071'] },
    { id: 'owasp-zap', name: 'OWASP ZAP', icon: '🕷️', category: 'pentest', subcategory: 'opensource', nameEn: 'Zed Attack Proxy', description: 'Web应用扫描、主动扫描、被动扫描', version: '2.14', author: 'OWASP', type: 'opensource', installed: false, rating: 4.6, downloads: 3800, apiEndpoint: 'http://zap-host:8090/UI/', apiAuth: 'API Key', mitreCoverage: ['T1053', 'T1071'] },
    { id: 'sqlmap', name: 'SQLMap', icon: '💉', category: 'pentest', subcategory: 'opensource', nameEn: 'SQLMap', description: 'SQL注入检测与利用，支持多种数据库', version: '1.8', author: 'SQLMap Team', type: 'opensource', installed: false, rating: 4.7, downloads: 4200, apiEndpoint: 'CLI工具', apiAuth: '无', mitreCoverage: ['T1053', 'T1071'] },
    { id: 'nmap', name: 'Nmap', icon: '🗺️', category: 'pentest', subcategory: 'opensource', nameEn: 'Nmap', description: '端口扫描、服务发现、操作系统检测', version: '7.94', author: 'Nmap Team', type: 'opensource', installed: false, rating: 4.9, downloads: 7800, apiEndpoint: 'CLI工具', apiAuth: '无', mitreCoverage: ['T1046', 'T1016'] },
    { id: 'nikto', name: 'Nikto', icon: '🔍', category: 'pentest', subcategory: 'opensource', nameEn: 'Nikto', description: 'Web服务器扫描、危险文件检测、CGI检测', version: '2.5', author: 'CIRT.net', type: 'opensource', installed: false, rating: 4.3, downloads: 2600, apiEndpoint: 'CLI工具', apiAuth: '无', mitreCoverage: ['T1046', 'T1016'] },
    { id: 'recon-ng', name: 'Recon-ng', icon: '🔎', category: 'pentest', subcategory: 'opensource', nameEn: 'Recon-ng', description: 'Web侦察、信息收集、域名发现', version: '5.1', author: 'BitofWar', type: 'opensource', installed: false, rating: 4.2, downloads: 1400, apiEndpoint: 'CLI工具', apiAuth: 'API Keys', mitreCoverage: ['T1016', 'T1595'] },
    { id: 'cobalt-strike', name: 'Cobalt Strike', icon: '⚔️', category: 'pentest', subcategory: 'commercial', nameEn: 'Cobalt Strike', description: '渗透测试框架、Beacon C2、钓鱼模拟', version: '4.8', author: 'Strategic Cyber', type: 'commercial', installed: false, rating: 4.8, downloads: 2100, apiEndpoint: 'https://cobaltstrike-host:50050/api/v1/', apiAuth: 'Team Server Creds', mitreCoverage: ['T1053', 'T1071'] },
    { id: 'core-impact', name: 'Core Impact', icon: '💥', category: 'pentest', subcategory: 'commercial', nameEn: 'Core Impact', description: '漏洞利用、植入物管理、后渗透', version: '2024.1', author: 'NCC Group', type: 'commercial', installed: false, rating: 4.5, downloads: 780, apiEndpoint: 'https://core-impact-host:7443/api/v1/', apiAuth: 'API Token', mitreCoverage: ['T1053', 'T1068'] },
    { id: 'theharvester', name: 'theHarvester', icon: '📧', category: 'pentest', subcategory: 'opensource', nameEn: 'theHarvester', description: '邮件地址、子域名、虚拟主机收集', version: '9.0', author: 'Christian Martorella', type: 'opensource', installed: false, rating: 4.4, downloads: 1900, apiEndpoint: 'CLI工具', apiAuth: '无', mitreCoverage: ['T1016', 'T1595'] },
    { id: 'immunity-canvas', name: 'Immunity Canvas', icon: '🎯', category: 'pentest', subcategory: 'commercial', nameEn: 'Immunity Canvas', description: '漏洞利用开发、0day研究', version: '7.0', author: 'Immunity', type: 'commercial', installed: false, rating: 4.3, downloads: 450, apiEndpoint: 'https://canvas-host:8443/api/', apiAuth: 'License Key', mitreCoverage: ['T1053', 'T1068'] },

    // ==================== SIEM (9) ====================
    { id: 'elastic-siem', name: 'Elastic SIEM', icon: '🔵', category: 'siem', subcategory: 'opensource', nameEn: 'ELK Stack', description: '日志收集、告警分析、可视化、Kibana', version: '8.12', author: 'Elastic', type: 'opensource', installed: false, rating: 4.6, downloads: 5500, apiEndpoint: 'https://elastic-host:9200/_search', apiAuth: 'Basic Auth/API Key', mitreCoverage: ['T1070', 'T1047'] },
    { id: 'wazuh', name: 'Wazuh', icon: '🟣', category: 'siem', subcategory: 'opensource', nameEn: 'Wazuh', description: '端点检测、日志分析、威胁响应、完整性检查', version: '4.7', author: 'Wazuh', type: 'opensource', installed: false, rating: 4.5, downloads: 3200, apiEndpoint: 'https://wazuh-host:55000/api/v4.0/', apiAuth: 'JWT Token', mitreCoverage: ['T1070', 'T1047'] },
    { id: 'security-onion', name: 'Security Onion', icon: '🧅', category: 'siem', subcategory: 'opensource', nameEn: 'Security Onion', description: '网络安全监控、IDS/IPS、完整数据包捕获', version: '2.3', author: 'Security Onion Team', type: 'opensource', installed: false, rating: 4.5, downloads: 1800, apiEndpoint: 'https://securityonion-host:9200/', apiAuth: 'Basic Auth/Cert', mitreCoverage: ['T1040', 'T1070'] },
    { id: 'splunk-es', name: 'Splunk Enterprise Security', icon: '🟢', category: 'siem', subcategory: 'commercial', nameEn: 'Splunk ES', description: '日志管理、威胁检测、安全分析、仪表板', version: '7.2', author: 'Splunk', type: 'commercial', installed: false, rating: 4.7, downloads: 4800, apiEndpoint: 'https://splunk-host:8089/services/search/jobs', apiAuth: 'Bearer Token', mitreCoverage: ['T1070', 'T1047'] },
    { id: 'ibm-qradar', name: 'IBM QRadar', icon: '🔷', category: 'siem', subcategory: 'commercial', nameEn: 'IBM QRadar', description: '威胁检测、事件分析、合规报告、Ariel查询', version: '7.5', author: 'IBM', type: 'commercial', installed: false, rating: 4.5, downloads: 2900, apiEndpoint: 'https://qradar-host:443/api/ariel/searchjobs', apiAuth: 'SEC Token', mitreCoverage: ['T1070', 'T1047'] },
    { id: 'azure-sentinel', name: 'Azure Sentinel', icon: '☁️', category: 'siem', subcategory: 'saas', nameEn: 'Azure Sentinel', description: '云SIEM、威胁检测、事件自动化响应、KQL查询', version: '2024', author: 'Microsoft', type: 'saas', installed: false, rating: 4.6, downloads: 3600, apiEndpoint: 'https://management.azure.com/', apiAuth: 'Azure AD OAuth 2.0', mitreCoverage: ['T1070', 'T1053'] },
    { id: 'google-chronicle', name: 'Google Chronicle', icon: '📜', category: 'siem', subcategory: 'saas', nameEn: 'Google Chronicle', description: '安全分析、日志存储、威胁追溯、SIEM', version: 'v1', author: 'Google', type: 'saas', installed: false, rating: 4.5, downloads: 2200, apiEndpoint: 'https://backstory.googleapis.com/v1/', apiAuth: 'Service Account', mitreCoverage: ['T1070', 'T1040'] },
    { id: 'splunk-soar', name: 'Splunk SOAR', icon: '🤖', category: 'siem', subcategory: 'commercial', nameEn: 'Splunk Phantom', description: '安全编排自动化响应、剧本执行、第三方集成', version: '6.2', author: 'Splunk', type: 'commercial', installed: false, rating: 4.6, downloads: 1600, apiEndpoint: 'https://phantom-host/rest/', apiAuth: 'Username/Password+2FA', mitreCoverage: ['T1053', 'T1047'] },
    { id: 'apache-metron', name: 'Apache Metron', icon: '⚡', category: 'siem', subcategory: 'opensource', nameEn: 'Metron', description: '安全分析、实时告警、威胁情报整合、Hadoop生态', version: '0.7', author: 'Apache', type: 'opensource', installed: false, rating: 4.0, downloads: 780, apiEndpoint: 'https://metron-host:8080/api/v1/', apiAuth: 'Kerberos/Basic Auth', mitreCoverage: ['T1040'] },

    // ==================== 端点安全 (10) ====================
    { id: 'osquery', name: 'osquery', icon: '📋', category: 'endpoint', subcategory: 'opensource', nameEn: 'osquery', description: '端点检测查询、文件完整性、用户监控、SQL接口', version: '5.10', author: 'osquery Team', type: 'opensource', installed: false, rating: 4.7, downloads: 2800, apiEndpoint: 'http://osquery-host:48000/api/v1/query', apiAuth: '无', mitreCoverage: ['T1016', 'T1053'] },
    { id: 'velociraptor', name: 'Velociraptor', icon: '🦖', category: 'endpoint', subcategory: 'opensource', nameEn: 'Velociraptor', description: '数字取证、终端检测、威胁狩猎、VQL查询', version: '0.6.9', author: 'Velociraptor Team', type: 'opensource', installed: false, rating: 4.7, downloads: 1200, apiEndpoint: 'https://vr-host:8000/api/v0/', apiAuth: 'Client Cert/User Auth', mitreCoverage: ['T1016', 'T1053'] },
    { id: 'crowdstrike-falcon', name: 'CrowdStrike Falcon', icon: '🦅', category: 'endpoint', subcategory: 'commercial', nameEn: 'CrowdStrike Falcon', description: '端点保护、威胁狩猎、事件响应、EDR', version: '2024.1', author: 'CrowdStrike', type: 'commercial', installed: false, rating: 4.8, downloads: 5200, apiEndpoint: 'https://api.crowdstrike.com/api/v2/', apiAuth: 'Client ID/Secret/OAuth', mitreCoverage: ['T1053', 'T1070'] },
    { id: 'carbon-black', name: 'Carbon Black Response', icon: '⚫', category: 'endpoint', subcategory: 'commercial', nameEn: 'VMware CB Defense', description: '终端检测响应(EDR)、应用控制、威胁响应', version: '3.8', author: 'VMware', type: 'commercial', installed: false, rating: 4.5, downloads: 2400, apiEndpoint: 'https://defense-prod05.cbdq.io/api/v5/', apiAuth: 'API Secret Key', mitreCoverage: ['T1053', 'T1070'] },
    { id: 'sentinelone', name: 'SentinelOne', icon: '1️⃣', category: 'endpoint', subcategory: 'commercial', nameEn: 'SentinelOne', description: '端点保护、自动化响应、威胁狩猎、EDR', version: '23.2', author: 'SentinelOne', type: 'commercial', installed: false, rating: 4.6, downloads: 2800, apiEndpoint: 'https://#SentinelOne-Host/api/v2.1/', apiAuth: 'Token', mitreCoverage: ['T1053', 'T1070'] },
    { id: 'microsoft-defender', name: 'Microsoft Defender for Endpoint', icon: '🛡️', category: 'endpoint', subcategory: 'saas', nameEn: 'MD4E', description: '端点检测响应(EDR)、威胁分析、自动修复、ASR', version: '2024', author: 'Microsoft', type: 'saas', installed: false, rating: 4.7, downloads: 6200, apiEndpoint: 'https://api.securitycenter.microsoft.com/api/', apiAuth: 'Azure AD OAuth 2.0', mitreCoverage: ['T1053', 'T1070'] },
    { id: 'cortex-xdr', name: 'Palo Alto Cortex XDR', icon: '🔴', category: 'endpoint', subcategory: 'commercial', nameEn: 'Cortex XDR', description: '网络检测响应、端点检测、用户行为分析、XDR', version: '8.0', author: 'Palo Alto', type: 'commercial', installed: false, rating: 4.5, downloads: 2100, apiEndpoint: 'https://xdr-host/api/v1/', apiAuth: 'API Key+XSRF Token', mitreCoverage: ['T1053', 'T1070'] },
    { id: 'wazuh-agent', name: 'Wazuh Agent', icon: '🟣', category: 'endpoint', subcategory: 'opensource', nameEn: 'Wazuh Agent', description: '文件完整性监控、注册表监控、Rootkit检测', version: '4.7', author: 'Wazuh', type: 'opensource', installed: false, rating: 4.4, downloads: 1800, apiEndpoint: 'Manager:55000/tcp', apiAuth: 'Agent Key', mitreCoverage: ['T1069', 'T1053'] },
    { id: 'sophos-edr', name: 'Sophos Intercept X', icon: '🟢', category: 'endpoint', subcategory: 'commercial', nameEn: 'Sophos Intercept X', description: '端点检测响应、反勒索软件、深度学习威胁检测', version: '2024.1', author: 'Sophos', type: 'commercial', installed: false, rating: 4.4, downloads: 1900, apiEndpoint: 'https://intercept-x.api.sophos.com/', apiAuth: 'OAuth 2.0', mitreCoverage: ['T1053', 'T1070'] },
    { id: 'tanium', name: 'Tanium', icon: '⚫', category: 'endpoint', subcategory: 'commercial', nameEn: 'Tanium', description: '端点管理、实时可见性、合规检测、快速响应', version: '7.5', author: 'Tanium', type: 'commercial', installed: false, rating: 4.5, downloads: 1200, apiEndpoint: 'https://tanium-host/behaviors/', apiAuth: 'Session Token', mitreCoverage: ['T1016', 'T1053'] },

    // ==================== 容器与云安全 (11) ====================
    { id: 'trivy', name: 'Trivy', icon: '💎', category: 'cloud-container', subcategory: 'opensource', nameEn: 'Trivy', description: '容器镜像扫描、漏洞检测、密钥检测、SBOM生成', version: '0.50', author: 'Aqua Security', type: 'opensource', installed: false, rating: 4.8, downloads: 4800, apiEndpoint: 'http://trivy-host:8080/', apiAuth: '无', mitreCoverage: ['T1525', 'T1070'] },
    { id: 'anchore', name: 'Anchore', icon: '⚓', category: 'cloud-container', subcategory: 'opensource', nameEn: 'Anchore Enterprise', description: '镜像分析、合规检查、策略评估、CVE扫描', version: '6.0', author: 'Anchore', type: 'opensource', installed: false, rating: 4.5, downloads: 1600, apiEndpoint: 'https://anchore-host:8228/v2/', apiAuth: 'Basic Auth/API Token', mitreCoverage: ['T1525'] },
    { id: 'clair', name: 'Clair', icon: '🔍', category: 'cloud-container', subcategory: 'opensource', nameEn: 'Clair', description: '容器漏洞静态分析、Kubernetes集成', version: '4.8', author: 'Quay', type: 'opensource', installed: false, rating: 4.3, downloads: 2200, apiEndpoint: 'http://clair-host:6060/', apiAuth: '无', mitreCoverage: ['T1525'] },
    { id: 'falco', name: 'Falco', icon: '🔥', category: 'cloud-container', subcategory: 'opensource', nameEn: 'Falco', description: '容器运行时安全监控、异常行为检测、K8s审计', version: '0.36', author: 'Sysdig', type: 'opensource', installed: false, rating: 4.7, downloads: 3400, apiEndpoint: 'http://falco-host:5060/', apiAuth: 'Client Cert', mitreCoverage: ['T1053', 'T1070'] },
    { id: 'prisma-cloud', name: 'Prisma Cloud', icon: '🌐', category: 'cloud-container', subcategory: 'saas', nameEn: 'Palo Alto Prisma Cloud', description: '云安全态势管理CSPM、合规检查、运行时保护', version: '2024.1', author: 'Palo Alto', type: 'saas', installed: false, rating: 4.6, downloads: 2800, apiEndpoint: 'https://api.prismacloud.io/', apiAuth: 'Access Key/Secret Key/JWT', mitreCoverage: ['T1525', 'T1070'] },
    { id: 'wiz', name: 'Wiz', icon: '☁️', category: 'cloud-container', subcategory: 'saas', nameEn: 'Wiz', description: '云安全态势管理、容器安全、无服务器安全、GraphQL', version: '2024.1', author: 'Wiz', type: 'saas', installed: false, rating: 4.7, downloads: 2400, apiEndpoint: 'https://api.wiz.io/graphql', apiAuth: 'Bearer Token', mitreCoverage: ['T1525', 'T1070'] },
    { id: 'orca-security', name: 'Orca Security', icon: '🐋', category: 'cloud-container', subcategory: 'saas', nameEn: 'Orca Security', description: '云资产发现、漏洞检测、合规评估、无代理', version: '2024', author: 'Orca', type: 'saas', installed: false, rating: 4.6, downloads: 1800, apiEndpoint: 'https://api.orcasecurity.io/api/v1/', apiAuth: 'API Token', mitreCoverage: ['T1525', 'T1070'] },
    { id: 'snyk', name: 'Snyk', icon: '🟡', category: 'cloud-container', subcategory: 'saas', nameEn: 'Snyk', description: '容器镜像扫描、代码漏洞检测、依赖项分析、SCA', version: '2024.1', author: 'Snyk', type: 'saas', installed: false, rating: 4.7, downloads: 4200, apiEndpoint: 'https://api.snyk.io/v1/', apiAuth: 'API Token', mitreCoverage: ['T1525', 'T1070'] },
    { id: 'aqua-security', name: 'Aqua Security', icon: '🌊', category: 'cloud-container', subcategory: 'commercial', nameEn: 'Aqua Security', description: '容器安全、运行时保护、微服务防火墙、Image扫描', version: '2024.1', author: 'Aqua Security', type: 'commercial', installed: false, rating: 4.5, downloads: 1600, apiEndpoint: 'https://aqua-host:8080/api/v1/', apiAuth: 'User/Password/API Key', mitreCoverage: ['T1525', 'T1070'] },
    { id: 'dagda', name: 'Dagda', icon: '🐉', category: 'cloud-container', subcategory: 'opensource', nameEn: 'Dagda', description: '容器安全分析、恶意软件检测、漏洞扫描', version: '1.0', author: 'Elias Brashear', type: 'opensource', installed: false, rating: 4.1, downloads: 580, apiEndpoint: 'http://dagda-host:5000/api/', apiAuth: '无', mitreCoverage: ['T1525', 'T1070'] },
    { id: 'kube-bench', name: 'kube-bench', icon: '☸️', category: 'cloud-container', subcategory: 'opensource', nameEn: 'kube-bench', description: 'Kubernetes CIS基准测试、合规检查、自动化审计', version: '1.0', author: 'Aqua Security', type: 'opensource', installed: false, rating: 4.5, downloads: 1400, apiEndpoint: 'CLI工具', apiAuth: '无', mitreCoverage: ['T1070'] },

    // ==================== 代码安全与DevSecOps (9) ====================
    { id: 'sonarqube', name: 'SonarQube', icon: '🐛', category: 'code-security', subcategory: 'opensource', nameEn: 'SonarQube', description: '代码质量检测、安全漏洞扫描、代码重复率、技术债', version: '10.4', author: 'SonarSource', type: 'opensource', installed: false, rating: 4.6, downloads: 3800, apiEndpoint: 'https://sonarqube-host/api/ce/', apiAuth: 'User/Password/Token', mitreCoverage: ['T1070', 'T1053'] },
    { id: 'semgrep', name: 'Semgrep', icon: '🔎', category: 'code-security', subcategory: 'opensource', nameEn: 'Semgrep', description: '静态应用安全测试SAST、自定义规则、多语言支持', version: '1.60', author: 'Semgrep Team', type: 'opensource', installed: false, rating: 4.7, downloads: 2400, apiEndpoint: 'https://api.semgrep.dev/v1/', apiAuth: 'API Token', mitreCoverage: ['T1070'] },
    { id: 'snyk-code', name: 'Snyk Open Source', icon: '🟢', category: 'code-security', subcategory: 'saas', nameEn: 'Snyk Open Source', description: '开源依赖漏洞检测、许可证合规、代码安全', version: '2024.1', author: 'Snyk', type: 'saas', installed: false, rating: 4.6, downloads: 3200, apiEndpoint: 'https://api.snyk.io/v1/', apiAuth: 'API Token', mitreCoverage: ['T1070'] },
    { id: 'checkmarx', name: 'Checkmarx SAST', icon: '🔴', category: 'code-security', subcategory: 'commercial', nameEn: 'Checkmarx', description: '代码安全分析、漏洞追踪、IAST、 SCA', version: '9.6', author: 'Checkmarx', type: 'commercial', installed: false, rating: 4.7, downloads: 2100, apiEndpoint: 'https://checkmarx-host/cxrestapi/', apiAuth: 'SSO/API Key/Basic Auth', mitreCoverage: ['T1070', 'T1053'] },
    { id: 'veracode', name: 'Veracode', icon: '🟢', category: 'code-security', subcategory: 'saas', nameEn: 'Veracode', description: 'SAST/DAST/SCA组合分析、移动应用测试、API安全', version: '2024.1', author: 'Veracode', type: 'saas', installed: false, rating: 4.5, downloads: 1800, apiEndpoint: 'https://analysiscenter.veracode.com/api/3.0/', apiAuth: 'API ID/Key', mitreCoverage: ['T1070', 'T1053'] },
    { id: 'contrast-security', name: 'Contrast Security', icon: '🔵', category: 'code-security', subcategory: 'commercial', nameEn: 'Contrast Security', description: '运行时应用自保护RASP、IAST、代码防护', version: '2024.1', author: 'Contrast', type: 'commercial', installed: false, rating: 4.4, downloads: 980, apiEndpoint: 'https://app.contrastsecurity.com/ContrastAPI/api/', apiAuth: 'API Key/Basic Auth', mitreCoverage: ['T1070', 'T1053'] },
    { id: 'synopsys-coverity', name: 'Synopsys Coverity', icon: '🛡️', category: 'code-security', subcategory: 'commercial', nameEn: 'Coverity', description: '代码缺陷检测、安全漏洞分析、静态分析', version: '2024.1', author: 'Synopsys', type: 'commercial', installed: false, rating: 4.6, downloads: 1400, apiEndpoint: 'https://coverity-host/api/', apiAuth: 'User/Password', mitreCoverage: ['T1070', 'T1053'] },
    { id: 'bandit', name: 'Bandit', icon: '🐍', category: 'code-security', subcategory: 'opensource', nameEn: 'Bandit', description: 'Python代码安全分析、AST遍历、问题检测', version: '1.7', author: 'PyCQA', type: 'opensource', installed: false, rating: 4.3, downloads: 1200, apiEndpoint: 'CLI工具', apiAuth: '无', mitreCoverage: ['T1070'] },
    { id: 'grype', name: 'Grype', icon: '🔍', category: 'code-security', subcategory: 'opensource', nameEn: 'Grype', description: '容器镜像/SBOM漏洞扫描、数据库更新、多格式支持', version: '0.74', author: 'anchore', type: 'opensource', installed: false, rating: 4.6, downloads: 1800, apiEndpoint: 'CLI工具', apiAuth: '无', mitreCoverage: ['T1525'] },

    // ==================== 网络安全与IDS/IPS (7) ====================
    { id: 'suricata', name: 'Suricata', icon: '🚨', category: 'network-security', subcategory: 'opensource', nameEn: 'Suricata', description: 'IDS/IPS、网络安全监控、Eve.json日志', version: '7.0', author: 'OISF', type: 'opensource', installed: false, rating: 4.6, downloads: 2600, apiEndpoint: 'http://suricata-host:5001/', apiAuth: 'Basic Auth(可选)', mitreCoverage: ['T1040', 'T1070'] },
    { id: 'zeek', name: 'Zeek (Bro)', icon: '🔬', category: 'network-security', subcategory: 'opensource', nameEn: 'Zeek', description: '网络流量分析、协议解析、安全监控、JSON日志', version: '6.0', author: 'Zeek Project', type: 'opensource', installed: false, rating: 4.7, downloads: 2200, apiEndpoint: 'http://zeek-host:8080/', apiAuth: '无', mitreCoverage: ['T1040', 'T1070'] },
    { id: 'snort', name: 'Snort', icon: '🦅', category: 'network-security', subcategory: 'opensource', nameEn: 'Snort', description: '入侵检测系统、规则匹配、网络嗅探', version: '3.1', author: 'Cisco', type: 'opensource', installed: false, rating: 4.5, downloads: 3400, apiEndpoint: '本地CLI', apiAuth: '无', mitreCoverage: ['T1040'] },
    { id: 'cisco-firepower', name: 'Cisco Secure Firewall', icon: '🔷', category: 'network-security', subcategory: 'commercial', nameEn: 'Firepower NGFW', description: '下一代防火墙、入侵防御、URL过滤、SSL解密', version: '7.2', author: 'Cisco', type: 'commercial', installed: false, rating: 4.5, downloads: 2800, apiEndpoint: 'https://fmc-host/api/', apiAuth: 'API Token/Basic Auth', mitreCoverage: ['T1040', 'T1070'] },
    { id: 'palo-alto-ngfw', name: 'Palo Alto NGFW', icon: '🔴', category: 'network-security', subcategory: 'commercial', nameEn: 'PAN-OS NGFW', description: '下一代防火墙、威胁防御、SSL解密、User-ID', version: '11.0', author: 'Palo Alto', type: 'commercial', installed: false, rating: 4.7, downloads: 3200, apiEndpoint: 'https://panorama-host/api/', apiAuth: 'API Key', mitreCoverage: ['T1040', 'T1070'] },
    { id: 'checkpoint-q', name: 'Check Point Quantum', icon: '🟢', category: 'network-security', subcategory: 'commercial', nameEn: 'Check Point NGFW', description: '下一代防火墙、入侵防御、威胁防护、沙箱联动', version: 'R81.20', author: 'Check Point', type: 'commercial', installed: false, rating: 4.5, downloads: 1800, apiEndpoint: 'https://checkpoint-host:443/web_api/', apiAuth: 'API Key/User Session', mitreCoverage: ['T1040', 'T1070'] },
    { id: 'fortinet-fortigate', name: 'Fortinet FortiGate', icon: '🛡️', category: 'network-security', subcategory: 'commercial', nameEn: 'FortiGate NGFW', description: '下一代防火墙、SD-WAN、SSL检查、ZTNA', version: '7.4', author: 'Fortinet', type: 'commercial', installed: false, rating: 4.6, downloads: 3600, apiEndpoint: 'https://fortigate-host/api/v2/', apiAuth: 'API Key/Admin Token', mitreCoverage: ['T1040', 'T1070'] },

    // ==================== 邮件安全 (5) ====================
    { id: 'proofpoint-tap', name: 'Proofpoint TAP', icon: '📧', category: 'email-security', subcategory: 'saas', nameEn: 'Proofpoint TAP', description: '钓鱼邮件分析、恶意软件检测、URL点击追踪', version: 'v2', author: 'Proofpoint', type: 'saas', installed: false, rating: 4.6, downloads: 2400, apiEndpoint: 'https://tap.proofpoint.com/api/v2/', apiAuth: 'Service Principal/Secret', mitreCoverage: ['T1071', 'T1105'] },
    { id: 'mimecast', name: 'Mimecast', icon: '📬', category: 'email-security', subcategory: 'saas', nameEn: 'Mimecast', description: '邮件归档、安全网关、威胁防护、DLP', version: 'v2', author: 'Mimecast', type: 'saas', installed: false, rating: 4.4, downloads: 1600, apiEndpoint: 'https://api.mimecast.com/api/', apiAuth: 'Access Key/Secret Key', mitreCoverage: ['T1071'] },
    { id: 'abnormal-security', name: 'Abnormal Security', icon: '🛡️', category: 'email-security', subcategory: 'saas', nameEn: 'Abnormal Security', description: '异常行为检测、商务邮件入侵BEC防护、AI威胁检测', version: 'v1', author: 'Abnormal Security', type: 'saas', installed: false, rating: 4.7, downloads: 1200, apiEndpoint: 'https://api.abnormalsecurity.com/v1/', apiAuth: 'API Token', mitreCoverage: ['T1071'] },
    { id: 'spamassassin', name: 'Apache SpamAssassin', icon: '🗑️', category: 'email-security', subcategory: 'opensource', nameEn: 'SpamAssassin', description: '邮件垃圾过滤、规则评分、Bayesian分类', version: '3.4', author: 'Apache', type: 'opensource', installed: false, rating: 4.2, downloads: 2100, apiEndpoint: '本地CLI/spamd RPC', apiAuth: '无', mitreCoverage: ['T1070'] },
    { id: 'mailscanner', name: 'MailScanner', icon: '📨', category: 'email-security', subcategory: 'opensource', nameEn: 'MailScanner', description: '邮件病毒扫描、钓鱼检测、内容过滤', version: '5.0', author: 'MailScanner Team', type: 'opensource', installed: false, rating: 4.1, downloads: 980, apiEndpoint: '本地配置', apiAuth: '无', mitreCoverage: ['T1070'] },

    // ==================== 身份与访问安全 (6) ====================
    { id: 'okta', name: 'Okta', icon: '🔑', category: 'iam-security', subcategory: 'saas', nameEn: 'Okta', description: '身份认证、生命周期管理、API访问管理、SSO', version: '2024.1', author: 'Okta', type: 'saas', installed: false, rating: 4.7, downloads: 4200, apiEndpoint: 'https://.okta.com/api/v1/', apiAuth: 'API Token/OAuth 2.0', mitreCoverage: ['T1070', 'T1053'] },
    { id: 'azure-ad', name: 'Microsoft Azure AD', icon: '☁️', category: 'iam-security', subcategory: 'saas', nameEn: 'Azure Active Directory', description: '身份保护、条件访问、Privileged Identity Management', version: 'Graph API v1.0', author: 'Microsoft', type: 'saas', installed: false, rating: 4.6, downloads: 5800, apiEndpoint: 'https://graph.microsoft.com/v1.0/', apiAuth: 'Azure AD OAuth 2.0', mitreCoverage: ['T1070', 'T1053'] },
    { id: 'keycloak', name: 'Keycloak', icon: '🔐', category: 'iam-security', subcategory: 'opensource', nameEn: 'Keycloak', description: '身份认证授权、SSO、OAuth 2.0、LDAP集成', version: '23.0', author: 'Red Hat', type: 'opensource', installed: false, rating: 4.6, downloads: 2800, apiEndpoint: 'https://keycloak-host:8443/auth/admin/realms/{realm}', apiAuth: 'Admin Token/Service Account', mitreCoverage: ['T1070', 'T1053'] },
    { id: 'cyberark-pam', name: 'CyberArk PAM', icon: '🏦', category: 'iam-security', subcategory: 'commercial', nameEn: 'CyberArk Privileged Access Manager', description: '特权账户管理、密钥管理、会话监控、PVWA', version: '14.0', author: 'CyberArk', type: 'commercial', installed: false, rating: 4.6, downloads: 1800, apiEndpoint: 'https://cyberark-host/api/', apiAuth: 'Auth Token', mitreCoverage: ['T1070', 'T1053'] },
    { id: 'openiam', name: 'OpenIAM', icon: '🔓', category: 'iam-security', subcategory: 'opensource', nameEn: 'OpenIAM', description: '身份治理、访问管理、密码管理、WebUI', version: '4.3', author: 'OpenIAM', type: 'opensource', installed: false, rating: 4.3, downloads: 780, apiEndpoint: 'https://openiam-host:8080/openiam/', apiAuth: 'SSO/Basic Auth/JWT', mitreCoverage: ['T1070', 'T1053'] },
    { id: 'google-iam', name: 'Google Cloud IAM', icon: '🔷', category: 'iam-security', subcategory: 'saas', nameEn: 'Google Cloud IAM', description: '云资源访问控制、Workload Identity、Service Account', version: 'v1', author: 'Google', type: 'saas', installed: false, rating: 4.5, downloads: 3400, apiEndpoint: 'https://cloudresourcemanager.googleapis.com/v1/', apiAuth: 'Service Account/OAuth', mitreCoverage: ['T1070', 'T1053'] },

    // ==================== 密钥与密码安全 (5) ====================
    { id: 'hashicorp-vault', name: 'HashiCorp Vault', icon: '🔐', category: 'key-management', subcategory: 'opensource', nameEn: 'Vault', description: '密钥管理、加密即服务、动态凭据、PKI', version: '1.16', author: 'HashiCorp', type: 'opensource', installed: false, rating: 4.8, downloads: 4200, apiEndpoint: 'https://vault-host:8200/v1/', apiAuth: 'Token/AppRole/LDAP/K8s', mitreCoverage: ['T1070', 'T1053'] },
    { id: 'bitwarden', name: 'Bitwarden', icon: '🔒', category: 'key-management', subcategory: 'opensource', nameEn: 'Bitwarden', description: '密码管理、密码生成、安全共享、API集成', version: '2024.1', author: 'Bitwarden', type: 'opensource', installed: false, rating: 4.6, downloads: 2400, apiEndpoint: 'https://api.bitwarden.com/public/', apiAuth: 'Client ID/Secret/API Key', mitreCoverage: ['T1070'] },
    { id: '1password', name: '1Password Business', icon: '🔑', category: 'key-management', subcategory: 'commercial', nameEn: '1Password', description: '企业密码管理、敏感信息保护、Secrets Automation', version: '2024.1', author: '1Password', type: 'commercial', installed: false, rating: 4.7, downloads: 1800, apiEndpoint: 'https://1password.com/api/connect/', apiAuth: 'API Token', mitreCoverage: ['T1070', 'T1053'] },
    { id: 'cyberark-conjur', name: 'CyberArk Conjur', icon: '🏦', category: 'key-management', subcategory: 'commercial', nameEn: 'CyberArk Conjur', description: '密钥即服务、合规审计、开发者集成、OSS版本', version: '13.0', author: 'CyberArk', type: 'commercial', installed: false, rating: 4.5, downloads: 680, apiEndpoint: 'https://conjurserver-host/api/', apiAuth: 'Authenticator/API Key', mitreCoverage: ['T1070', 'T1053'] },
    { id: 'aws-secrets-manager', name: 'AWS Secrets Manager', icon: '☁️', category: 'key-management', subcategory: 'saas', nameEn: 'AWS Secrets Manager', description: '密钥轮换、跨区域复制、Lambda集成、IAM策略', version: 'v1', author: 'Amazon', type: 'saas', installed: false, rating: 4.6, downloads: 3800, apiEndpoint: 'https://secretsmanager.region.amazonaws.com/', apiAuth: 'IAM Role/Access Key', mitreCoverage: ['T1070', 'T1053'] },

    // ==================== SOAR自动化 (6) ====================
    { id: 'thehive', name: 'TheHive', icon: '🐝', category: 'soar', subcategory: 'opensource', nameEn: 'TheHive', description: '安全事件响应、案例管理、任务追踪、MISP联动', version: '5.2', author: 'TheHive Project', type: 'opensource', installed: false, rating: 4.5, downloads: 1400, apiEndpoint: 'https://thehive-host/api/v1/', apiAuth: 'API Key', mitreCoverage: ['T1053', 'T1070'] },
    { id: 'splunk-soar-enterprise', name: 'Splunk SOAR Enterprise', icon: '🤖', category: 'soar', subcategory: 'commercial', nameEn: 'Splunk Phantom', description: '安全编排自动化响应、剧本执行、第三方集成', version: '6.2', author: 'Splunk', type: 'commercial', installed: false, rating: 4.6, downloads: 1600, apiEndpoint: 'https://phantom-host/rest/', apiAuth: 'Username/Password+2FA', mitreCoverage: ['T1053', 'T1047'] },
    { id: 'palo-xsoar', name: 'Palo Alto XSOAR', icon: '🔴', category: 'soar', subcategory: 'commercial', nameEn: 'XSOAR (Demisto)', description: '安全编排、案例管理、威胁情报整合、剧本市场', version: '6.0', author: 'Palo Alto', type: 'commercial', installed: false, rating: 4.6, downloads: 1800, apiEndpoint: 'https://xsoar-host/api/v1/', apiAuth: 'API Key/OAuth', mitreCoverage: ['T1053', 'T1047'] },
    { id: 'd3-soar', name: 'D3 Security SOAR', icon: '🎯', category: 'soar', subcategory: 'commercial', nameEn: 'D3 SOAR', description: '自动化响应、剧本编排、资产关联、Ticketing', version: '2024.1', author: 'D3 Security', type: 'commercial', installed: false, rating: 4.4, downloads: 420, apiEndpoint: 'https://d3-host/api/v2/', apiAuth: 'API Token', mitreCoverage: ['T1053', 'T1047'] },
    { id: 'responder', name: 'Cymonix Responder', icon: '⚡', category: 'soar', subcategory: 'commercial', nameEn: 'Cymonix Responder', description: '安全编排、事件响应自动化、威胁情报整合', version: '4.0', author: 'Cymonix', type: 'commercial', installed: false, rating: 4.3, downloads: 280, apiEndpoint: 'https://responder-host/api/', apiAuth: 'API Token', mitreCoverage: ['T1053', 'T1047'] },
    { id: 'swimlane', name: 'Swimlane SOAR', icon: '🌊', category: 'soar', subcategory: 'commercial', nameEn: 'Swimlane', description: '安全编排自动化响应、案例管理、仪表板', version: '2024.1', author: 'Swimlane', type: 'commercial', installed: false, rating: 4.5, downloads: 580, apiEndpoint: 'https://swimlane-host/api/', apiAuth: 'OAuth 2.0', mitreCoverage: ['T1053', 'T1047'] },

    // ==================== DLP数据防泄漏 (3) ====================
    { id: 'mydlp', name: 'MyDLP', icon: '📄', category: 'dlp', subcategory: 'opensource', nameEn: 'MyDLP', description: '数据防泄漏、内容过滤、端点DLP、网络DLP', version: '0.9', author: 'MyDLP Team', type: 'opensource', installed: false, rating: 4.0, downloads: 320, apiEndpoint: 'https://mydlp-host/api/', apiAuth: 'Admin Token', mitreCoverage: ['T1070', 'T1053'] },
    { id: 'forcepoint-dlp', name: 'Forcepoint DLP', icon: '🛡️', category: 'dlp', subcategory: 'commercial', nameEn: 'Forcepoint DLP', description: '数据分类、策略执行、事件报告、Cloud DLP', version: '8.5', author: 'Forcepoint', type: 'commercial', installed: false, rating: 4.4, downloads: 980, apiEndpoint: 'https://forcepoint-dlp-host/api/', apiAuth: 'Service Account', mitreCoverage: ['T1070', 'T1053'] },
    { id: 'symantec-dlp', name: 'Symantec DLP', icon: '🔷', category: 'dlp', subcategory: 'commercial', nameEn: 'Broadcom Symantec DLP', description: '网络DLP、端点DLP、云DLP、合规报告', version: '15.8', author: 'Broadcom', type: 'commercial', installed: false, rating: 4.3, downloads: 1200, apiEndpoint: 'https://symantec-dlp-host:8443/api/', apiAuth: 'Vontu Proxy Creds', mitreCoverage: ['T1070', 'T1053'] },

    // ==================== 模糊测试 (3) ====================
    { id: 'afl', name: 'AFL (American Fuzzy Lop)', icon: '🦄', category: 'fuzzing', subcategory: 'opensource', nameEn: 'AFL', description: '模糊测试、覆盖率引导测试、LLVM模式', version: '2.52', author: 'Michał Zalewski', type: 'opensource', installed: false, rating: 4.7, downloads: 2400, apiEndpoint: 'CLI工具', apiAuth: '无', mitreCoverage: ['T1068'] },
    { id: 'libfuzzer', name: 'libFuzzer', icon: '📚', category: 'fuzzing', subcategory: 'opensource', nameEn: 'libFuzzer', description: '内存模糊测试、持续模糊测试、LLVM集成', version: 'LLVM 17', author: 'LLVM Project', type: 'opensource', installed: false, rating: 4.6, downloads: 1800, apiEndpoint: '本地编译测试', apiAuth: '无', mitreCoverage: ['T1068'] },
    { id: 'synopsys-defensics', name: 'Synopsys Defensics', icon: '🛡️', category: 'fuzzing', subcategory: 'commercial', nameEn: 'Defensics', description: '协议模糊测试、安全测试套件、Fuzzing框架', version: '2024.1', author: 'Synopsys', type: 'commercial', installed: false, rating: 4.5, downloads: 420, apiEndpoint: 'https://defensics-host:8443/api/', apiAuth: 'License Token', mitreCoverage: ['T1068'] },

    // ==================== 合规与治理 (6) ====================
    { id: 'inspec', name: 'InSpec', icon: '✅', category: 'compliance', subcategory: 'opensource', nameEn: 'Chef InSpec', description: '合规性测试、基础设施审计、CIS/NIST检查', version: '6.6', author: 'Chef/Progress', type: 'opensource', installed: false, rating: 4.5, downloads: 1200, apiEndpoint: 'CLI工具/Chef Automate', apiAuth: 'Chef Server Auth', mitreCoverage: ['T1070'] },
    { id: 'aws-security-hub', name: 'AWS Security Hub', icon: '☁️', category: 'compliance', subcategory: 'saas', nameEn: 'AWS Security Hub', description: '安全态势可见性、合规检查、自动化修复、CloudSec', version: 'v1', author: 'Amazon', type: 'saas', installed: false, rating: 4.5, downloads: 3200, apiEndpoint: 'https://securityhub.region.amazonaws.com/', apiAuth: 'IAM Role/Access Key', mitreCoverage: ['T1070', 'T1053'] },
    { id: 'azure-defender', name: 'Azure Defender / Defender for Cloud', icon: '☁️', category: 'compliance', subcategory: 'saas', nameEn: 'Microsoft Defender for Cloud', description: '云安全态势管理CSPM、威胁防护、合规评估', version: '2024', author: 'Microsoft', type: 'saas', installed: false, rating: 4.5, downloads: 2800, apiEndpoint: 'https://management.azure.com/subscriptions/{subId}/providers/Microsoft.Security/', apiAuth: 'Azure AD OAuth 2.0', mitreCoverage: ['T1070', 'T1053'] },
    { id: 'pagerduty', name: 'PagerDuty', icon: '🔔', category: 'compliance', subcategory: 'saas', nameEn: 'PagerDuty', description: '安全告警聚合、事件管理、on-call调度、自动化', version: '2024.1', author: 'PagerDuty', type: 'saas', installed: false, rating: 4.6, downloads: 2600, apiEndpoint: 'https://api.pagerduty.com/', apiAuth: 'API Token/OAuth', mitreCoverage: ['T1053', 'T1047'] },
    { id: 'drata', name: 'Drata', icon: '📋', category: 'compliance', subcategory: 'saas', nameEn: 'Drata', description: 'SOC2/ISO27001合规自动化、持续监控、证据收集', version: '2024.1', author: 'Drata', type: 'saas', installed: false, rating: 4.6, downloads: 980, apiEndpoint: 'https://api.drata.com/public/v1/', apiAuth: 'API Token', mitreCoverage: ['T1070', 'T1053'] },
    { id: 'vanta', name: 'Vanta', icon: '🛡️', category: 'compliance', subcategory: 'saas', nameEn: 'Vanta', description: 'SOC2/ISO27001合规自动化、风险评估、策略管理', version: '2024.1', author: 'Vanta', type: 'saas', installed: false, rating: 4.5, downloads: 680, apiEndpoint: 'https://api.vanta.com/v1/', apiAuth: 'OAuth 2.0', mitreCoverage: ['T1070', 'T1053'] },
  ];

  private categories = [
    { id: 'all', label: '全部', icon: '📦' },
    { id: 'core', label: '核心技能', icon: '🧠' },
    { id: 'vuln-scan', label: '漏洞扫描', icon: '🔍' },
    { id: 'threat-intel', label: '威胁情报', icon: '🧠' },
    { id: 'pentest', label: '渗透测试', icon: '⚔️' },
    { id: 'siem', label: 'SIEM', icon: '📊' },
    { id: 'endpoint', label: '端点安全', icon: '🖥️' },
    { id: 'cloud-container', label: '云/容器', icon: '☁️' },
    { id: 'code-security', label: '代码安全', icon: '💻' },
    { id: 'network-security', label: '网络安全', icon: '🌐' },
    { id: 'email-security', label: '邮件安全', icon: '📧' },
    { id: 'iam-security', label: '身份安全', icon: '🔑' },
    { id: 'key-management', label: '密钥管理', icon: '🔐' },
    { id: 'soar', label: 'SOAR', icon: '🤖' },
    { id: 'dlp', label: '数据防泄漏', icon: '📄' },
    { id: 'fuzzing', label: '模糊测试', icon: '🎯' },
    { id: 'compliance', label: '合规治理', icon: '✅' },
  ];

  static styles = css`
    :host { display: block; min-height: 100vh; background: var(--sc-bg-primary, #0f172a); color: var(--sc-text-primary, #f8fafc); font-family: system-ui, -apple-system, sans-serif; }
    .container { max-width: 1600px; margin: 0 auto; padding: 24px; }
    .hero { display: flex; gap: 24px; align-items: flex-start; padding: 32px; background: linear-gradient(135deg, var(--sc-bg-card, #1e293b) 0%, rgba(59, 130, 246, 0.1) 100%); border: 1px solid var(--sc-border-color, #334155); border-radius: 16px; margin-bottom: 32px; }
    .hero-icon { width: 72px; height: 72px; background: linear-gradient(135deg, #3B82F6, #2563EB); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 36px; flex-shrink: 0; }
    .hero-title { font-size: 28px; font-weight: 700; margin: 0 0 8px; }
    .hero-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(59, 130, 246, 0.15); color: #3B82F6; border-radius: 20px; font-size: 12px; font-weight: 500; margin-bottom: 12px; }
    .hero-desc { font-size: 15px; line-height: 1.6; color: var(--sc-text-secondary, #cbd5e1); margin: 0; max-width: 600px; }
    .filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
    .filter-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 50px; border: 1px solid var(--sc-border-color, #334155); background: var(--sc-bg-card, #1e293b); color: var(--sc-text-secondary, #cbd5e1); font-size: 13px; cursor: pointer; transition: all 200ms ease; }
    .filter-btn:hover { border-color: #3B82F6; color: var(--sc-text-primary, #f8fafc); }
    .filter-btn.active { border-color: #3B82F6; background: rgba(59, 130, 246, 0.15); color: #3B82F6; }
    .stats-row { display: flex; gap: 24px; margin-bottom: 32px; flex-wrap: wrap; }
    .stat-item { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--sc-text-secondary, #cbd5e1); }
    .stat-num { font-weight: 700; color: var(--sc-text-primary, #f8fafc); font-size: 18px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .card { background: var(--sc-bg-card, #1e293b); border: 1px solid var(--sc-border-color, #334155); border-radius: 12px; padding: 20px; cursor: pointer; transition: all 200ms ease; }
    .card:hover { border-color: #3B82F6; transform: translateY(-2px); }
    .card-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 10px; }
    .card-icon { width: 44px; height: 44px; background: var(--sc-bg-tertiary, #334155); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
    .card-info { flex: 1; min-width: 0; }
    .card-name { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
    .card-meta { display: flex; gap: 8px; font-size: 11px; color: var(--sc-text-tertiary, #94a3b8); flex-wrap: wrap; }
    .card-type { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500; }
    .type-opensource { background: rgba(16, 185, 129, 0.15); color: #10B981; }
    .type-commercial { background: rgba(59, 130, 246, 0.15); color: #3B82F6; }
    .type-saas { background: rgba(139, 92, 246, 0.15); color: #8B5CF6; }
    .card-desc { font-size: 12px; color: var(--sc-text-secondary, #cbd5e1); line-height: 1.4; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .card-footer { display: flex; justify-content: space-between; align-items: center; }
    .card-stats { display: flex; gap: 10px; font-size: 11px; color: var(--sc-text-tertiary, #94a3b8); }
    .badge-installed { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; background: rgba(16, 185, 129, 0.15); color: #10B981; }
    .badge-install { padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 500; background: linear-gradient(135deg, #3B82F6, #2563EB); color: white; border: none; cursor: pointer; }
    .badge-install:hover { transform: translateY(-1px); }
    .badge-installed-btn { padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 500; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); cursor: pointer; }
    .detail-panel { background: var(--sc-bg-card, #1e293b); border: 1px solid var(--sc-border-color, #334155); border-radius: 16px; padding: 28px; }
    .detail-header { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--sc-border-color, #334155); }
    .detail-icon { width: 68px; height: 68px; background: var(--sc-bg-tertiary, #334155); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 34px; }
    .detail-title { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    .detail-desc { font-size: 14px; color: var(--sc-text-secondary, #cbd5e1); line-height: 1.6; margin-bottom: 20px; }
    .detail-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
    .detail-stat { background: var(--sc-bg-tertiary, #334155); border-radius: 10px; padding: 14px; text-align: center; }
    .detail-stat-value { font-size: 22px; font-weight: 700; }
    .detail-stat-label { font-size: 11px; color: var(--sc-text-tertiary, #94a3b8); margin-top: 4px; }
    .detail-section { margin-bottom: 16px; }
    .detail-section-title { font-size: 13px; font-weight: 600; color: var(--sc-text-secondary); margin-bottom: 8px; }
    .detail-api { background: var(--sc-bg-primary, #0f172a); border-radius: 8px; padding: 12px; font-family: monospace; font-size: 12px; word-break: break-all; }
    .btn-back { padding: 8px 16px; background: var(--sc-bg-tertiary, #334155); color: var(--sc-text-primary, #f8fafc); border: 1px solid var(--sc-border-color, #334155); border-radius: 8px; font-size: 13px; cursor: pointer; margin-bottom: 20px; }
    .btn-back:hover { background: var(--sc-bg-hover, #475569); }
    .loading { text-align: center; padding: 48px; color: var(--sc-text-tertiary, #94a3b8); }
    .empty-state { text-align: center; padding: 64px; color: var(--sc-text-tertiary); }
    .toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; z-index: 300; animation: slideIn 0.3s ease; }
    .toast-success { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
    .toast-error { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
    .toast-info { background: rgba(59,130,246,0.15); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  `;

  private getAllSkills(): Skill[] {
    const local = [...this.coreSkills, ...this.securityTools];
    if (this.serverSkills.length === 0) return local;
    // Merge server skills as additional entries
    const localIds = new Set(local.map(s => s.id));
    const serverMapped: Skill[] = this.serverSkills
      .filter(s => !localIds.has(s.id))
      .map(s => ({
        id: s.id,
        name: s.name || s.id,
        icon: s.icon || '🔧',
        category: 'server',
        description: s.description || '',
        version: s.version || '1.0',
        author: s.author || 'SecuClaw',
        type: 'opensource' as const,
        installed: true,
        rating: s.rating || 4,
        downloads: s.downloads || 0,
      }));
    return [...local, ...serverMapped];
  }

  private getFilteredSkills(): Skill[] {
    const all = this.getAllSkills();
    if (this.activeFilter === 'all') return all;
    if (this.activeFilter === 'core') return this.coreSkills;
    return all.filter((s: Skill) => s.category === this.activeFilter);
  }

  private async installSkill(skill: Skill) {
    if (skill.category === 'core') {
      const idx = this.coreSkills.findIndex(s => s.id === skill.id);
      if (idx !== -1) this.coreSkills[idx].installed = true;
    } else {
      const idx = this.securityTools.findIndex(s => s.id === skill.id);
      if (idx !== -1) this.securityTools[idx].installed = true;
    }
    this.saveInstalledSkills();
    this.showToast(`✅ ${skill.name} 已安装`, 'success');
    // Force re-render
    this.requestUpdate();
  }

  private async uninstallSkill(skill: Skill) {
    if (skill.category === 'core') {
      const idx = this.coreSkills.findIndex(s => s.id === skill.id);
      if (idx !== -1) this.coreSkills[idx].installed = false;
    } else {
      const idx = this.securityTools.findIndex(s => s.id === skill.id);
      if (idx !== -1) this.securityTools[idx].installed = false;
    }
    this.saveInstalledSkills();
    this.showToast(`🗑️ ${skill.name} 已卸载`, 'info');
    this.requestUpdate();
  }

  private renderCard(skill: Skill) {
    const typeClass = skill.type === 'opensource' ? 'type-opensource' : skill.type === 'saas' ? 'type-saas' : 'type-commercial';
    const typeLabel = skill.type === 'opensource' ? '开源' : skill.type === 'saas' ? 'SaaS' : '商业';

    return html`
      <div class="card" @click=${() => { this.selectedSkill = skill; }}>
        <div class="card-header">
          <div class="card-icon">${skill.icon}</div>
          <div class="card-info">
            <div class="card-name">${skill.name}</div>
            <div class="card-meta">
              <span class="card-type ${typeClass}">${typeLabel}</span>
              <span>v${skill.version}</span>
              <span>⭐ ${skill.rating}</span>
            </div>
          </div>
        </div>
        <p class="card-desc">${skill.description}</p>
        <div class="card-footer">
          <div class="card-stats">
            <span>📥 ${skill.downloads}</span>
          </div>
          ${skill.installed
            ? html`<button class="badge-installed-btn" @click=${(e: Event) => { e.stopPropagation(); this.uninstallSkill(skill); }}>卸载</button>`
            : html`<button class="badge-install" @click=${(e: Event) => { e.stopPropagation(); this.installSkill(skill); }}>安装</button>`
          }
        </div>
      </div>
    `;
  }

  private renderDetail() {
    const skill = this.selectedSkill!;
    if (!skill) return '';

    const typeClass = skill.type === 'opensource' ? 'type-opensource' : skill.type === 'saas' ? 'type-saas' : 'type-commercial';
    const typeLabel = skill.type === 'opensource' ? '开源' : skill.type === 'saas' ? 'SaaS' : '商业';

    // Merge skill.sources with sourcesMap data
    const sourcesFromMap = this.getSources(skill.id);
    const mergedSources = { ...(sourcesFromMap || {}), ...(skill.sources || {}) };

    return html`
      <div class="container">
        <button class="btn-back" @click=${() => { this.selectedSkill = null; }}>← 返回技能市场</button>
        
        <div class="detail-panel">
          <div class="detail-header">
            <div class="detail-icon">${skill.icon}</div>
            <div>
              <div class="detail-title">${skill.name}</div>
              <div class="card-meta" style="gap:12px;">
                <span class="card-type ${typeClass}">${typeLabel}</span>
                <span>版本: ${skill.version}</span>
                <span>作者: ${skill.author}</span>
              </div>
            </div>
          </div>

          <p class="detail-desc">${skill.description}</p>

          <div class="detail-grid">
            <div class="detail-stat">
              <div class="detail-stat-value">${skill.rating}</div>
              <div class="detail-stat-label">⭐ 评分</div>
            </div>
            <div class="detail-stat">
              <div class="detail-stat-value">${skill.downloads}</div>
              <div class="detail-stat-label">📥 下载</div>
            </div>
            <div class="detail-stat">
              <div class="detail-stat-value">${skill.type === 'opensource' ? '开源' : skill.type === 'saas' ? 'SaaS' : '商业'}</div>
              <div class="detail-stat-label">📌 类型</div>
            </div>
          </div>

          ${mergedSources ? html`
            <div class="detail-section">
              <div class="detail-section-title">🌐 技能出处</div>
              <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
                ${mergedSources.homepage ? html`
                  <a href="${mergedSources.homepage}" target="_blank" style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--sc-bg-primary,#0f172a);border-radius:8px;color:var(--sc-text-secondary,#cbd5e1);text-decoration:none;font-size:13px;">
                    <span>🏠</span>
                    <span>官网</span>
                  </a>
                ` : ''}
                ${mergedSources.api_doc ? html`
                  <a href="${mergedSources.api_doc}" target="_blank" style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--sc-bg-primary,#0f172a);border-radius:8px;color:var(--sc-text-secondary,#cbd5e1);text-decoration:none;font-size:13px;">
                    <span>📖</span>
                    <span>API文档</span>
                  </a>
                ` : ''}
                ${mergedSources.github ? html`
                  <a href="${mergedSources.github}" target="_blank" style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--sc-bg-primary,#0f172a);border-radius:8px;color:var(--sc-text-secondary,#cbd5e1);text-decoration:none;font-size:13px;">
                    <span>⚙️</span>
                    <span>GitHub</span>
                  </a>
                ` : ''}
                ${mergedSources.pricing ? html`
                  <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--sc-bg-primary,#0f172a);border-radius:8px;font-size:13px;color:var(--sc-text-secondary,#cbd5e1);">
                    <span>💰</span>
                    <span>${mergedSources.pricing}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          ${skill.apiEndpoint ? html`
            <div class="detail-section">
              <div class="detail-section-title">🔗 API 端点</div>
              <div class="detail-api">${skill.apiEndpoint}</div>
            </div>
          ` : ''}

          ${skill.apiAuth || mergedSources?.api_type ? html`
            <div class="detail-section">
              <div class="detail-section-title">🔐 认证方式</div>
              <div class="detail-api">${skill.apiAuth || mergedSources?.api_type || ''}</div>
            </div>
          ` : ''}

          ${skill.mitreCoverage && skill.mitreCoverage.length > 0 ? html`
            <div class="detail-section">
              <div class="detail-section-title">🎯 MITRE ATT&CK 覆盖</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;">
                ${skill.mitreCoverage.map((t: string) => html`<span class="card-type type-commercial">${t}</span>`)}
              </div>
            </div>
          ` : ''}

          <div style="margin-top:24px;display:flex;gap:12px;">
            ${skill.installed
              ? html`<button class="badge-installed-btn" style="padding:10px 20px;font-size:14px;" @click=${() => this.uninstallSkill(skill)}>🗑️ 卸载技能</button>`
              : html`<button class="badge-install" style="padding:10px 20px;font-size:14px;" @click=${() => this.installSkill(skill)}>⬇️ 安装技能</button>`
            }
          </div>
        </div>
      </div>
    `;
  }

  render() {
    if (this.selectedSkill) return this.renderDetail();

    const filtered = this.getFilteredSkills();
    const allSkills = this.getAllSkills();
    const installed = allSkills.filter(s => s.installed).length;
    const categoryCount = new Set(allSkills.map(s => s.category)).size;

    return html`
      <sc-smart-recommendation-bar></sc-smart-recommendation-bar>
      <div class="container">
        <div class="hero">
          <div class="hero-icon">🛒</div>
          <div>
            <h1 class="hero-title">🔧 安全技能市场</h1>
            <span class="hero-badge">🤖 ${allSkills.length}+ 安全工具</span>
            <p class="hero-desc">浏览、安装和管理100+开源与商业安全工具技能。每个技能都支持API接入，可扩展SecuClaw的安全能力。</p>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-item"><span class="stat-num">${allSkills.length}</span> 可用技能</div>
          <div class="stat-item"><span class="stat-num">${installed}</span> 已安装</div>
          <div class="stat-item"><span class="stat-num">${categoryCount}</span> 分类</div>
        </div>

        <div class="filters">
          ${this.categories.map(c => html`
            <button class="filter-btn ${this.activeFilter === c.id ? 'active' : ''}" @click=${() => { this.activeFilter = c.id; }}>
              ${c.icon} ${c.label}
            </button>
          `)}
        </div>

        ${filtered.length === 0 ? html`
          <div class="empty-state">
            <div style="font-size:48px;margin-bottom:16px;">🔍</div>
            <div>该分类下暂无技能</div>
          </div>
        ` : html`
          <div class="grid">
            ${filtered.map(s => this.renderCard(s))}
          </div>
        `}

        ${this.toastMessage ? html`<div class="toast toast-${this.toastType}">${this.toastMessage}</div>` : ''}
      </div>
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'sc-skills-market': ScSkillsMarket; } }
