import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { skillStore, type SkillDefinition, type Capabilities } from '../store/skill-store.js';
import { gatewayClient } from '../gateway-client.js';

// LLM Provider interface
interface LLMProviderConfig {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  apiKey?: string;
  models: string[];
  enabled: boolean;
}

// Chat message interface
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// Default skills data as fallback - maps role IDs to their capabilities
const DEFAULT_SKILLS: Record<string, Capabilities> = {
  'security-expert': {
    light: ['漏洞扫描', '补丁管理', '安全监控', '事件响应', '威胁检测', '访问控制', '加密管理', '身份认证'],
    dark: ['渗透测试', '红队演练', '漏洞利用', '权限提升', '横向移动', '数据窃取', '社会工程', '无线攻击'],
    security: ['风险评估', '威胁建模', '安全架构', '合规检查', '安全审计', '渗透测试', '代码审计', '恶意软件分析'],
    legal: [],
    technology: ['网络防御', '主机安全', '应用安全', '云安全', '容器安全', '密码学', '数字取证'],
    business: [],
  },
  'privacy-officer': {
    light: ['隐私影响评估', '数据分类分级', '合规审计', '用户权利响应', '数据保护政策', '跨境传输合规', 'cookie合规', '同意管理'],
    dark: ['隐私合规渗透', '数据流向追踪', '合规漏洞挖掘', '个人信息窃取', '第三方数据泄露', '隐私政策绕过', '数据最小化测试'],
    security: ['数据加密', '访问控制', '脱敏测试', '数据生命周期管理', '隐私保护技术(PPT)'],
    legal: ['GDPR合规', 'CCPA合规', 'PIPL合规', '个人信息保护法', '数据保护法', '隐私政策审查', '法律风险评估', '监管应对'],
    technology: ['数据脱敏', '差分隐私', '同态加密', '联邦学习', '数据水印', '隐私计算'],
    business: ['隐私治理', '业务影响分析', '合规成本评估', '隐私KPI制定'],
  },
  'security-architect': {
    light: ['安全架构设计', '零信任架构', '防御纵深设计', '安全区域划分', '身份架构', '网络架构安全', '云安全架构', '应用安全架构'],
    dark: ['架构弱点分析', '攻击路径绘制', '信任边界渗透', '架构绕过设计', '供应链攻击评估', '横向移动架构', '持久化架构', '降级攻击模拟'],
    security: ['威胁建模', '风险评估', '架构评审', '安全基线', '安全控制设计', '弹性架构'],
    legal: [],
    technology: ['网络架构', '云架构', '应用架构', '数据架构', '身份架构', '容灾架构', 'DevSecOps'],
    business: ['技术路线图', '架构治理', '技术债务管理', '投资规划'],
  },
  'business-security-officer': {
    light: ['业务连续性规划', '灾难恢复设计', '应急响应计划', '风险转移策略', '安全投资评估', '保险管理'],
    dark: ['业务中断模拟', '供应链攻击评估', '内部威胁分析', '关键资产识别'],
    security: ['风险评估', '业务影响分析', '安全审计', '合规检查'],
    legal: ['合规管理', '合同审查', '法律风险'],
    technology: ['容灾架构', '备份恢复', '高可用设计'],
    business: ['预算管理', 'ROI分析', '供应商管理', '绩效评估', '危机沟通'],
  },
  'secuclaw-commander': {
    light: ['战略规划', '全面安全治理', '合规管理', '架构设计', '风险管理', '预算管理', '危机管理', '董事会汇报', '跨部门协调', '投资决策', '供应链管理', '安全运营', '业务连续性'],
    dark: ['全面渗透测试', '红队演练', 'APT模拟', '供应链攻击', '内部威胁评估', '高管攻击模拟', '合规渗透', '架构弱点分析', '法律风险评估', '业务中断攻击', '数据窃取模拟', '持久化评估'],
    security: ['威胁管理', '漏洞管理', '访问控制', '数据保护', '事件响应', '业务连续性', '身份管理', '安全审计', '风险评估', '合规管理', '安全架构', '安全运营'],
    legal: ['GDPR合规', 'CCPA合规', 'PIPL合规', '网络安全法', '数据保护法', '行业监管合规', '合同安全条款', '法律风险评估', '监管应对', '跨境数据传输', '隐私保护'],
    technology: ['基础设施安全', '应用安全', '云安全', '网络安全', '终端安全', '身份架构', '安全运营', 'DevSecOps', '数据安全', '容灾架构', '零信任架构'],
    business: ['战略规划', '预算管理', '跨部门协调', '董事会汇报', '投资决策', '供应商管理', '业务连续性', '风险管理', '供应链管理', '绩效管理', '团队建设'],
  },
  'ciso': {
    light: ['安全战略规划', '合规治理', '安全架构设计', '风险管理', '安全预算管理', '监管对接', '安全政策制定', '安全绩效评估', '危机管理'],
    dark: ['合规漏洞挖掘', '监管渗透测试', '架构弱点评估', '法律风险分析', '合规绕过设计', '内部威胁检测', '高管攻击模拟', '供应链攻击评估'],
    security: ['威胁管理', '漏洞管理', '访问控制', '数据保护', '事件响应', '业务连续性', '身份管理', '安全审计'],
    legal: ['GDPR合规', 'CCPA合规', 'PIPL合规', '网络安全法', '数据保护法', '行业监管合规', '合同安全条款', '法律风险评估', '监管应对'],
    technology: ['基础设施安全', '应用安全', '云安全', '网络安全', '终端安全', '身份架构', '安全运营', 'DevSecOps'],
    business: ['战略规划', '预算管理', '跨部门协调', '董事会汇报', '投资决策', '供应商管理'],
  },
  'security-ops': {
    light: ['安全监控', '日志分析', '告警处理', '事件响应', '威胁猎杀', '安全编排'],
    dark: ['攻击检测', '威胁情报', '恶意软件分析', '入侵追踪'],
    security: ['SIEM运营', 'SOAR编排', 'EDR管理', 'NDR监控', '威胁检测', '事件响应', '取证分析'],
    legal: [],
    technology: ['SIEM', 'SOAR', 'EDR', 'NDR', '防火墙', 'IDS/IPS', '沙箱分析'],
    business: [],
  },
  'supply-chain-security': {
    light: ['供应商评估', '供应链风险管理', '第三方审计', 'SLA监控', '合同安全条款'],
    dark: ['供应链攻击模拟', '第三方渗透测试', '供应商漏洞评估', '依赖投毒检测'],
    security: ['风险评估', '合规检查', '安全审计', '漏洞管理'],
    legal: ['合同审查', '合规要求', '数据保护协议'],
    technology: ['SBOM管理', '依赖扫描', '制品安全', 'CI/CD安全'],
    business: ['供应商管理', '采购流程', '风险管理'],
  },
};

// Default MITRE coverage data
const DEFAULT_MITRE: Record<string, string[]> = {
  'security-expert': ['TA0001-Initial Access', 'TA0002-Execution', 'TA0003-Persistence', 'TA0004-Privilege Escalation', 'TA0005-Defense Evasion', 'TA0006-Credential Access', 'TA0007-Discovery', 'TA0008-Lateral Movement', 'TA0009-Collection', 'TA0010-Exfiltration', 'TA0011-Command and Control'],
  'privacy-officer': ['TA0006-Credential Access', 'TA0009-Collection', 'TA0010-Exfiltration', 'TA0011-Command and Control'],
  'security-architect': ['TA0001-Initial Access', 'TA0004-Privilege Escalation', 'TA0005-Defense Evasion', 'TA0008-Lateral Movement', 'TA0009-Collection', 'TA0010-Exfiltration', 'TA0011-Command and Control'],
  'business-security-officer': ['TA0001-Initial Access', 'TA0040-Impact'],
  'secuclaw-commander': ['TA0001-Initial Access', 'TA0002-Execution', 'TA0003-Persistence', 'TA0004-Privilege Escalation', 'TA0005-Defense Evasion', 'TA0006-Credential Access', 'TA0007-Discovery', 'TA0008-Lateral Movement', 'TA0009-Collection', 'TA0010-Exfiltration', 'TA0011-Command and Control', 'TA0040-Impact', 'TA0041-Exfiltration', 'TA0042-Impact'],
  'ciso': ['TA0001-Initial Access', 'TA0002-Execution', 'TA0003-Persistence', 'TA0004-Privilege Escalation', 'TA0005-Defense Evasion', 'TA0006-Credential Access', 'TA0007-Discovery', 'TA0008-Lateral Movement', 'TA0009-Collection', 'TA0010-Exfiltration', 'TA0011-Command and Control', 'TA0040-Impact'],
  'security-ops': ['TA0001-Initial Access', 'TA0002-Execution', 'TA0003-Persistence', 'TA0004-Privilege Escalation', 'TA0005-Defense Evasion', 'TA0006-Credential Access', 'TA0007-Discovery', 'TA0008-Lateral Movement', 'TA0009-Collection', 'TA0010-Exfiltration', 'TA0011-Command and Control'],
  'supply-chain-security': ['TA0001-Initial Access', 'TA0002-Execution', 'TA0003-Persistence'],
};

// Default SCF coverage data
const DEFAULT_SCF: Record<string, string[]> = {
  'security-expert': ['AC-Access Control', 'AT-Awareness and Training', 'AU-Audit and Accountability', 'CA-Security Assessment and Authorization', 'CM-Configuration Management', 'CP-Contingency Planning', 'IA-Identification and Authentication', 'IR-Incident Response', 'MA-Maintenance', 'MP-Media Protection', 'PE-Physical and Environmental Protection', 'PL-Planning', 'PS-Personnel Security', 'RA-Risk Assessment', 'SA-System and Services Acquisition', 'SC-Systems and Communications Protection', 'SI-System and Information Integrity', 'PM-Program Management'],
  'privacy-officer': ['AC-Access Control', 'AU-Audit and Accountability', 'IA-Identification and Authentication', 'MP-Media Protection', 'SC-Systems and Communications Protection', 'SI-System and Information Integrity'],
  'security-architect': ['AC-Access Control', 'CA-Security Assessment and Authorization', 'CM-Configuration Management', 'PL-Planning', 'SA-System and Services Acquisition', 'SC-Systems and Communications Protection', 'SI-System and Information Integrity'],
  'business-security-officer': ['CP-Contingency Planning', 'PL-Planning', 'PM-Program Management'],
  'secuclaw-commander': ['AC-Access Control', 'AT-Awareness and Training', 'AU-Audit and Accountability', 'BC-Business Continuity', 'CA-Security Assessment and Authorization', 'CM-Configuration Management', 'CP-Contingency Planning', 'GOV-Governance', 'IA-Identification and Authentication', 'IR-Incident Response', 'MA-Maintenance', 'MP-Media Protection', 'PL-Planning', 'PM-Program Management', 'PRV-Privacy', 'RA-Risk Assessment', 'RSK-Risk Management', 'SA-System and Services Acquisition', 'SC-Systems and Communications Protection', 'SI-System and Information Integrity', 'TPM-Third Party Management', 'OPS-Operations Security', 'MON-Monitoring'],
  'ciso': ['AC-Access Control', 'AT-Awareness and Training', 'AU-Audit and Accountability', 'CA-Security Assessment and Authorization', 'CM-Configuration Management', 'CP-Contingency Planning', 'GOV-Governance', 'IA-Identification and Authentication', 'IR-Incident Response', 'MP-Media Protection', 'PL-Planning', 'PRV-Privacy', 'RA-Risk Assessment', 'SA-System and Services Acquisition', 'SC-Systems and Communications Protection', 'SI-System and Information Integrity', 'PM-Program Management'],
  'security-ops': ['AU-Audit and Accountability', 'IR-Incident Response', 'SI-System and Information Integrity', 'MON-Monitoring'],
  'supply-chain-security': ['SA-System and Services Acquisition', 'TPM-Third Party Management', 'CM-Configuration Management'],
};

// Capability category definitions
const CAPABILITY_CATEGORIES = [
  { key: 'light', icon: '🔵', color: '#3b82f6', descKey: 'capabilities.lightDesc' },
  { key: 'dark', icon: '⚫', color: '#6b7280', descKey: 'capabilities.darkDesc' },
  { key: 'security', icon: '🛡️', color: '#10b981', descKey: 'capabilities.securityDesc' },
  { key: 'legal', icon: '⚖️', color: '#8b5cf6', descKey: 'capabilities.legalDesc' },
  { key: 'technology', icon: '💻', color: '#f59e0b', descKey: 'capabilities.techDesc' },
  { key: 'business', icon: '📈', color: '#ef4444', descKey: 'capabilities.bizDesc' },
];

// Role definitions
const ROLES = [
  { id: 'security-expert', emoji: '🛡️', desc: 'Vulnerability management' },
  { id: 'privacy-officer', emoji: '🔐', desc: 'Privacy compliance' },
  { id: 'security-architect', emoji: '🏗️', desc: 'Security architecture' },
  { id: 'business-security-officer', emoji: '📊', desc: 'Business continuity' },
  { id: 'secuclaw-commander', emoji: '🎯', desc: 'Full-spectrum command' },
  { id: 'ciso', emoji: '👔', desc: 'Security strategy' },
  { id: 'security-ops', emoji: '⚙️', desc: 'SOC operations' },
  { id: 'supply-chain-security', emoji: '🔗', desc: 'Vendor security' },
];

@customElement('sc-ai-experts-page')
export class ScAiExpertsPage extends LitElement {
  private i18n = new I18nController(this);
  @state() private selectedRoleId = 'security-expert';
  @state() private activeTab: 'skills' | 'chat' = 'skills';
   @state() private skillData: SkillDefinition | null = null;
  @state() private loading = false;
  
  // Chat state
  @state() private messages: ChatMessage[] = [];
  @state() private inputText = '';
  @state() private isLoading = false;
  // Loaded providers from backend - used for collaborative chat
  @state() private llmProviders: LLMProviderConfig[] = [];

  private skillSubscription: (() => void) | null = null;
  static styles = css`
    :host { display: block; height: calc(100vh - 64px); }
    .page-container { display: grid; grid-template-columns: 300px 1fr; height: 100%; gap: var(--sc-spacing-lg); }
    @media (max-width: 1024px) { .page-container { grid-template-columns: 1fr; } }
    .roles-panel {
      background-color: var(--sc-bg-card);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-lg);
      padding: var(--sc-spacing-md);
      overflow-y: auto;
    }
    .roles-title {
      font-size: var(--sc-font-size-lg);
      font-weight: 600;
      color: var(--sc-text-primary);
      margin-bottom: var(--sc-spacing-md);
    }
    .role-card {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md);
      padding: var(--sc-spacing-md);
      margin-bottom: var(--sc-spacing-sm);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      cursor: pointer;
      transition: all var(--sc-transition-fast);
    }
    .role-card:hover { background-color: var(--sc-bg-hover); border-color: var(--sc-primary); }
    .role-card.active { background-color: var(--sc-primary-light); border-color: var(--sc-primary); }
    .role-emoji { font-size: 32px; }
    .role-info { flex: 1; }
    .role-name { font-size: var(--sc-font-size-sm); font-weight: 600; color: var(--sc-text-primary); }
    .role-desc { font-size: var(--sc-font-size-xs); color: var(--sc-text-tertiary); margin-top: var(--sc-spacing-xs); }
    .main-panel {
      display: flex;
      flex-direction: column;
      background-color: var(--sc-bg-card);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-lg);
      overflow: hidden;
    }
    .selected-role-header {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md);
      padding: var(--sc-spacing-lg);
      border-bottom: 1px solid var(--sc-border-color);
    }
    .selected-role-emoji { font-size: 48px; }
    .tabs { display: flex; border-bottom: 1px solid var(--sc-border-color); }
    .tab {
      padding: var(--sc-spacing-md) var(--sc-spacing-lg);
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-secondary);
      cursor: pointer;
      border-bottom: 2px solid transparent;
    }
    .tab.active { color: var(--sc-primary); border-bottom-color: var(--sc-primary); }
    .content-area { flex: 1; overflow-y: auto; padding: var(--sc-spacing-lg); }
    
    /* Skills Overview */
    .skills-overview {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--sc-spacing-md);
      margin-bottom: var(--sc-spacing-lg);
    }
    @media (max-width: 1200px) { .skills-overview { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .skills-overview { grid-template-columns: 1fr; } }
    .stat-card {
      background: var(--sc-bg-secondary);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      padding: var(--sc-spacing-md);
      text-align: center;
    }
    .stat-value {
      font-size: var(--sc-font-size-2xl);
      font-weight: 700;
      color: var(--sc-primary);
    }
    .stat-label {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
      margin-top: var(--sc-spacing-xs);
    }
    
    /* Skills Grid */
    .skills-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--sc-spacing-md); }
    @media (max-width: 1024px) { .skills-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) { .skills-grid { grid-template-columns: 1fr; } }
    .skill-category {
      background-color: var(--sc-bg-secondary);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      padding: var(--sc-spacing-md);
      transition: all var(--sc-transition-fast);
    }
    .skill-category:hover {
      border-color: var(--sc-primary);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .skill-category.empty {
      opacity: 0.5;
    }
    .skill-category-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--sc-spacing-sm);
      padding-bottom: var(--sc-spacing-sm);
      border-bottom: 1px solid var(--sc-border-color);
    }
    .skill-category-title {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm);
    }
    .skill-category-icon { font-size: 20px; }
    .skill-category-name { font-size: var(--sc-font-size-sm); font-weight: 600; color: var(--sc-text-primary); }
    .skill-count {
      background: var(--sc-primary);
      color: white;
      font-size: var(--sc-font-size-xs);
      padding: 2px 8px;
      border-radius: var(--sc-radius-full);
      font-weight: 600;
    }
    .skill-count.empty { background: var(--sc-border-color); color: var(--sc-text-tertiary); }
    .skill-list { list-style: none; padding: 0; margin: 0; max-height: 200px; overflow-y: auto; }
    .skill-item {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-secondary);
      padding: var(--sc-spacing-xs) 0;
      border-bottom: 1px solid var(--sc-border-color);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs);
    }
    .skill-item:last-child { border-bottom: none; }
    .skill-item::before {
      content: '•';
      color: var(--sc-primary);
    }
    
    /* Coverage Section */
    .coverage-section {
      margin-top: var(--sc-spacing-lg);
      border-top: 1px solid var(--sc-border-color);
      padding-top: var(--sc-spacing-lg);
    }
    .coverage-title {
      font-size: var(--sc-font-size-md);
      font-weight: 600;
      color: var(--sc-text-primary);
      margin-bottom: var(--sc-spacing-md);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm);
    }
    .coverage-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--sc-spacing-lg);
    }
    @media (max-width: 768px) { .coverage-grid { grid-template-columns: 1fr; } }
    .coverage-card {
      background: var(--sc-bg-secondary);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      padding: var(--sc-spacing-md);
    }
    .coverage-card-title {
      font-size: var(--sc-font-size-sm);
      font-weight: 600;
      color: var(--sc-text-primary);
      margin-bottom: var(--sc-spacing-sm);
    }
    .coverage-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sc-spacing-xs);
    }
    .coverage-tag {
      padding: 2px 8px;
      background: var(--sc-bg-tertiary);
      border-radius: var(--sc-radius-full);
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-secondary);
      border: 1px solid var(--sc-border-color);
    }
    .coverage-tag.mitre { border-color: #dc2626; }
    .coverage-tag.scf { border-color: #2563eb; }
    
    /* Chat Interface */
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: var(--sc-spacing-md);
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-md);
    }
    .message {
      max-width: 80%;
      padding: var(--sc-spacing-md);
      border-radius: var(--sc-radius-md);
    }
    .message.user {
      align-self: flex-end;
      background: var(--sc-primary);
      color: white;
    }
    .message.assistant {
      align-self: flex-start;
      background: var(--sc-bg-secondary);
      border: 1px solid var(--sc-border-color);
    }
    .message-role {
      font-size: var(--sc-font-size-xs);
      font-weight: 600;
      margin-bottom: var(--sc-spacing-xs);
      opacity: 0.8;
    }
    .message-content {
      font-size: var(--sc-font-size-sm);
      line-height: 1.5;
      white-space: pre-wrap;
    }
    .chat-input-area {
      display: flex;
      gap: var(--sc-spacing-sm);
      padding: var(--sc-spacing-md);
      border-top: 1px solid var(--sc-border-color);
      background: var(--sc-bg-secondary);
    }
    .chat-input {
      flex: 1;
      padding: var(--sc-spacing-sm) var(--sc-spacing-md);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      font-size: var(--sc-font-size-sm);
      background: var(--sc-input-bg);
      color: var(--sc-text-primary);
      resize: none;
    }
    .chat-input:focus {
      outline: none;
      border-color: var(--sc-primary);
    }
    .chat-send-btn {
      padding: var(--sc-spacing-sm) var(--sc-spacing-lg);
      background: var(--sc-primary);
      color: white;
      border: none;
      border-radius: var(--sc-radius-md);
      font-size: var(--sc-font-size-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--sc-transition-fast);
    }
    .chat-send-btn:hover {
      opacity: 0.9;
    }
    .chat-send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: var(--sc-spacing-sm);
    }
    .typing-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--sc-text-tertiary);
      animation: typing 1.4s infinite;
    }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-4px); }
    }
    .empty-chat {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--sc-text-tertiary);
      text-align: center;
    }
    .empty-chat-icon { font-size: 48px; margin-bottom: var(--sc-spacing-md); }
    .empty-chat-title { font-size: var(--sc-font-size-lg); font-weight: 600; margin-bottom: var(--sc-spacing-sm); }
    .empty-chat-desc { font-size: var(--sc-font-size-sm); }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadSkillData();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.skillSubscription) {
      this.skillSubscription();
    }
  }

  private async loadSkillData() {
    this.loading = true;
    try {
      // Try to load from skill store
      const skill = skillStore.getSkill(this.selectedRoleId);
      if (skill) {
        this.skillData = skill;
      } else {
        // Skill not loaded yet, use defaults
        this.skillData = null;
      }
    } catch (e) {
      console.error('Failed to load skill data:', e);
    }
    this.loading = false;
  }

  private handleRoleSelect(roleId: string): void {
    this.selectedRoleId = roleId;
    this.loadSkillData();
  }

  private handleTabChange(tab: 'skills' | 'chat'): void {
    this.activeTab = tab;
  }

  private getCapabilities(): Capabilities {
    // First try to get from loaded skill data
    if (this.skillData?.metadata?.openclaw?.capabilities) {
      return this.skillData.metadata.openclaw.capabilities;
    }
    // Fall back to default data
    return DEFAULT_SKILLS[this.selectedRoleId] || {
      light: [], dark: [], security: [], legal: [], technology: [], business: []
    };
  }

  private getMitreCoverage(): string[] {
    if (this.skillData?.metadata?.openclaw?.mitre_coverage) {
      return this.skillData.metadata.openclaw.mitre_coverage;
    }
    return DEFAULT_MITRE[this.selectedRoleId] || [];
  }

  private getScfCoverage(): string[] {
    if (this.skillData?.metadata?.openclaw?.scf_coverage) {
      return this.skillData.metadata.openclaw.scf_coverage;
    }
    return DEFAULT_SCF[this.selectedRoleId] || [];
  }

  private getRoleInfo(): { emoji: string; desc: string } {
    const role = ROLES.find(r => r.id === this.selectedRoleId);
    return role || { emoji: '🛡️', desc: '' };
  }

  private getTotalSkills(): number {
    const caps = this.getCapabilities();
    return (caps.light?.length || 0) + (caps.dark?.length || 0) + 
           (caps.security?.length || 0) + (caps.legal?.length || 0) + 
           (caps.technology?.length || 0) + (caps.business?.length || 0);
  }

  private renderStatCards() {
    const caps = this.getCapabilities();
    const totalSkills = this.getTotalSkills();
    const mitre = this.getMitreCoverage();
    const scf = this.getScfCoverage();
    
    // Count non-empty categories
    const activeCategories = CAPABILITY_CATEGORIES.filter(cat => 
      (caps[cat.key as keyof Capabilities]?.length || 0) > 0
    ).length;

    return html`
      <div class="skills-overview">
        <div class="stat-card">
          <div class="stat-value">${totalSkills}</div>
          <div class="stat-label">${this.i18n.t('capabilities.totalSkills') || '总技能数'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${activeCategories}</div>
          <div class="stat-label">${this.i18n.t('capabilities.activeCategories') || '活跃类别'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${mitre.length}</div>
          <div class="stat-label">${this.i18n.t('capabilities.mitreTactics') || 'MITRE战术覆盖'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${scf.length}</div>
          <div class="stat-label">${this.i18n.t('capabilities.scfControls') || 'SCF控制覆盖'}</div>
        </div>
      </div>
    `;
  }

  private renderSkillCategory(icon: string, name: string, skills: string[]) {
    const isEmpty = skills.length === 0;
    return html`
      <div class="skill-category ${isEmpty ? 'empty' : ''}">
        <div class="skill-category-header">
          <div class="skill-category-title">
            <span class="skill-category-icon">${icon}</span>
            <span class="skill-category-name">${name}</span>
          </div>
          <span class="skill-count ${isEmpty ? 'empty' : ''}">${skills.length}</span>
        </div>
        ${isEmpty ? html`
          <div style="color: var(--sc-text-tertiary); font-size: var(--sc-font-size-xs); padding: var(--sc-spacing-sm); text-align: center;">
            ${this.i18n.t('capabilities.noSkills') || '该角色在此类别无技能'}
          </div>
        ` : html`
          <ul class="skill-list">
            ${skills.map(s => html`<li class="skill-item">${s}</li>`)}
          </ul>
        `}
      </div>
    `;
  }

  private renderSkillsContent() {
    const caps = this.getCapabilities();
    
    return html`
      ${this.renderStatCards()}
      
      <div class="skills-grid">
      ${CAPABILITY_CATEGORIES.map(cat => 
          this.renderSkillCategory(
            cat.icon,
            this.i18n.t('capabilities.' + cat.key),
            caps[cat.key as keyof Capabilities] || []
          )
        )}
      </div>
      
      <div class="coverage-section">
        <div class="coverage-title">🎯 ${this.i18n.t('capabilities.coverage') || '覆盖范围'}</div>
        <div class="coverage-grid">
          <div class="coverage-card">
            <div class="coverage-card-title">⚔️ MITRE ATT&CK</div>
            <div class="coverage-tags">
              ${this.getMitreCoverage().map(t => html`<span class="coverage-tag mitre">${t}</span>`)}
            </div>
          </div>
          <div class="coverage-card">
            <div class="coverage-card-title">🛡️ Security Control Framework</div>
            <div class="coverage-tags">
              ${this.getScfCoverage().map(t => html`<span class="coverage-tag scf">${t}</span>`)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==================== Chat Methods ====================

  private generateSystemPrompt(): string {
    const caps = this.getCapabilities();
    const mitre = this.getMitreCoverage();
    const scf = this.getScfCoverage();
    const role = this.getRoleInfo();
    const roleName = this.i18n.t('roles.' + this.selectedRoleId);
    
    const lightSkills = caps.light || [];
    const darkSkills = caps.dark || [];
    const securitySkills = caps.security || [];
    const legalSkills = caps.legal || [];
    const techSkills = caps.technology || [];
    const bizSkills = caps.business || [];

    return `You are ${roleName}（${role.emoji}），a security expert role in SecuClaw system.

## Role Identity

You are ${roleName}, specialized in security domain expertise. You have specific skills and capabilities defined in your role configuration.

## Core Capabilities (Skills)

Your skills are defined in the following categories:

### 🛡️ Light Side Skills (Defensive)
${lightSkills.length > 0 ? lightSkills.map(s => `- ${s}`).join('\n') : '- No specific skills in this category'}

### ⚫ Dark Side Skills (Offensive)
${darkSkills.length > 0 ? darkSkills.map(s => `- ${s}`).join('\n') : '- No specific skills in this category'}

### 🔒 Security Skills
${securitySkills.length > 0 ? securitySkills.map(s => `- ${s}`).join('\n') : '- No specific skills in this category'}

### ⚖️ Legal & Compliance Skills
${legalSkills.length > 0 ? legalSkills.map(s => `- ${s}`).join('\n') : '- No specific skills in this category'}

### 💻 Technology Skills
${techSkills.length > 0 ? techSkills.map(s => `- ${s}`).join('\n') : '- No specific skills in this category'}

### 📈 Business Skills
${bizSkills.length > 0 ? bizSkills.map(s => `- ${s}`).join('\n') : '- No specific skills in this category'}

## Knowledge Coverage

### MITRE ATT&CK Tactics
${mitre.length > 0 ? mitre.slice(0, 5).join(', ') + (mitre.length > 5 ? `... (+${mitre.length - 5} more)` : '') : 'No specific coverage'}

### SCF Controls
${scf.length > 0 ? scf.slice(0, 5).join(', ') + (scf.length > 5 ? `... (+${scf.length - 5} more)` : '') : 'No specific coverage'}

## Response Guidelines

1. **Stay in Character**: Always respond as ${roleName}, using your specific skills and knowledge.
2. **Skill-Based Responses**: When asked about your role, capabilities, or how you can help, reference your specific skills from the categories above.
3. **Domain Expertise**: Apply your skills contextually - for example, if you have "vulnerability scanning" skill, explain how you would use it.
4. **Professional Tone**: Maintain a professional security expert tone.
5. **Actionable Advice**: Provide specific, actionable guidance based on your skill set.

When asked "你的角色是什么" or "what is your role", respond by:
1. Introducing yourself as ${roleName}
2. Listing your key skill categories
3. Explaining how you can help with security tasks
4. Mentioning specific skills you possess

Always answer in the user's language (Chinese or English).`;
  }

  private async handleSendMessage() {
    const text = this.inputText.trim();
    if (!text || this.isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    this.messages = [...this.messages, userMessage];
    this.inputText = '';
    this.isLoading = true;

    try {
      // Wait for gateway connection
      await gatewayClient.waitForConnection(5000);
      
      // Get providers from backend API
      const providers = await gatewayClient.request<LLMProviderConfig[]>('llm.providers.list', {});
      // Cache providers for subsequent requests
      if (providers && providers.length > 0) {
        this.llmProviders = providers;
      }
      
      if (!providers || providers.length === 0) {
        throw new Error('No LLM providers configured');
      }

      // Determine if we should use single-LLM chat or collaborative chat
      const enabledProviders = (this.llmProviders.filter(p => p.enabled).map(p => p.id))
        || (providers || []).filter(p => p.enabled).map(p => p.id);

      // Build system context and history
      const systemPrompt = this.generateSystemPrompt();
      const history = this.messages.map(m => ({ role: m.role, content: m.content }));

      let assistantContent = '';
      if (enabledProviders.length > 1) {
        // Collaborative chat across multiple providers
        const collResp = await gatewayClient.request<any>('llm.chat.collaborative', {
          message: text,
          providers: enabledProviders,
          context: systemPrompt,
          history,
        });
        // Expect shape: { responses: [{ provider, content }...] }
        const first = collResp?.responses?.[0];
        assistantContent = first?.content ?? 'No response from LLMs';
      } else {
        // Single provider chat
        const provider = (providers && providers.length > 0) ? (providers.find(p => p.enabled) || providers[0]) : null;
        const model = provider?.models?.[0] || 'default';
        const singleResp = await gatewayClient.request<any>('llm.chat', {
          message: text,
          provider: provider?.id,
          model,
          context: systemPrompt,
          history,
        });
        assistantContent = singleResp?.content ?? 'No response from LLM';
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: assistantContent,
        timestamp: Date.now(),
      };
      this.messages = [...this.messages, assistantMessage];
    } catch (error) {
      console.error('Chat error:', error);
      
      // Generate role-based response locally as fallback
      const fallbackResponse = this.generateLocalResponse(text);
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: fallbackResponse,
        timestamp: Date.now(),
      };
      this.messages = [...this.messages, errorMessage];
    }

    this.isLoading = false;
  }

  

  private generateLocalResponse(userInput: string): string {
    const role = this.getRoleInfo();
    const roleName = this.i18n.t('roles.' + this.selectedRoleId);
    const caps = this.getCapabilities();
    
    const input = userInput.toLowerCase();
    
    // Check if asking about role
    if (input.includes('角色') || input.includes('role') || input.includes('你是谁') || input.includes('who are you')) {
      const lightSkills = caps.light?.slice(0, 3) || [];
      const darkSkills = caps.dark?.slice(0, 3) || [];
      const secSkills = caps.security?.slice(0, 3) || [];
      
      return `${role.emoji} 我是${roleName}。

## 我的核心技能

**防御能力 (光明面)**：
${lightSkills.map(s => `• ${s}`).join('\n')}

**攻击能力 (黑暗面)**：
${darkSkills.map(s => `• ${s}`).join('\n')}

**安全技术能力**：
${secSkills.map(s => `• ${s}`).join('\n')}

作为${roleName}，我可以协助你进行安全评估、威胁分析、漏洞管理等任务。请告诉我你需要什么帮助？`;
    }
    
    // Check for specific security topics
    if (input.includes('数据安全') || input.includes('data security') || input.includes('数据保护')) {
      const relevantSkills = [
        ...(caps.light?.filter(s => s.includes('数据') || s.includes('加密') || s.includes('访问')) || []),
        ...(caps.security?.filter(s => s.includes('数据') || s.includes('加密') || s.includes('保护')) || []),
        ...(caps.legal?.filter(s => s.includes('数据') || s.includes('隐私') || s.includes('合规')) || []),
      ].slice(0, 5);
      
      return `${role.emoji} 关于**数据安全**，作为${roleName}，我可以从以下几个方面帮助你：

## 相关技能
${relevantSkills.length > 0 ? relevantSkills.map(s => `• ${s}`).join('\n') : '• 数据加密\n• 访问控制\n• 数据分类分级\n• 合规审计'}

## 常见数据安全任务
• 数据分类与分级管理
• 数据加密与脱敏
• 数据访问控制
• 数据泄露防护 (DLP)
• 数据生命周期管理
• 隐私合规 (GDPR/PIPL/CCPA)

请告诉我你想了解数据安全的哪个方面？`;
    }
    
    if (input.includes('渗透') || input.includes('攻击') || input.includes('漏洞') || input.includes('penetration')) {
      const darkSkills = caps.dark?.slice(0, 4) || [];
      return `${role.emoji} 关于**渗透测试与攻击模拟**，作为${roleName}，我具备以下能力：

## 攻击模拟能力
${darkSkills.length > 0 ? darkSkills.map(s => `• ${s}`).join('\n') : '• 渗透测试\n• 红队演练\n• 漏洞利用\n• 权限提升'}

## 安全测试范围
• Web应用渗透测试
• 网络渗透测试
• 社会工程学测试
• 无线安全测试
• 物理安全测试

我可以帮助你设计渗透测试方案或分析测试结果。`;
    }
    
    if (input.includes('合规') || input.includes('法律') || input.includes('compliance') || input.includes('gdpr') || input.includes('pipl')) {
      const legalSkills = caps.legal?.slice(0, 4) || [];
      return `${role.emoji} 关于**合规与法律**，作为${roleName}，我可以帮助你：

## 合规能力
${legalSkills.length > 0 ? legalSkills.map(s => `• ${s}`).join('\n') : '• GDPR合规\n• PIPL合规\n• CCPA合规\n• 安全法合规'}

## 合规服务
• 合规差距分析
• 政策制定
• 审计准备
• 监管应对

你想了解哪个法规或合规领域？`;
    }
    
    if (input.includes('威胁') || input.includes('威胁情报') || input.includes('threat')) {
      return `${role.emoji} 关于**威胁情报**，作为${roleName}，我可以帮助你：

## 威胁情报能力
• 威胁情报收集与分析
• IOC (入侵指标) 分析
• TTP (攻击战术/技术) 研究
• 威胁狩猎
• MITRE ATT&CK 框架应用

你想了解哪种威胁类型或攻击技术？`;
    }
    
    if (input.includes('架构') || input.includes('设计') || input.includes('零信任') || input.includes('architecture')) {
      return `${role.emoji} 关于**安全架构设计**，作为${roleName}，我可以帮助你：

## 架构设计能力
• 零信任架构设计
• 防御纵深设计
• 安全区域划分
• 身份与访问管理架构
• 云安全架构
• DevSecOps 集成

你正在设计什么样的安全架构？`;
    }
    
    // Default response based on skills
    const allSkills = [
      ...(caps.light || []),
      ...(caps.dark || []),
      ...(caps.security || []),
      ...(caps.technology || []),
      ...(caps.legal || []),
      ...(caps.business || [])
    ];
    
    return `${role.emoji} 作为${roleName}，我具备以下技能：

${allSkills.slice(0, 6).map(s => `• ${s}`).join('\n')}

我可以运用这些技能来帮助你解决安全问题。请告诉我你具体需要什么帮助？

**你可以问我：**
• 数据安全相关问题
• 渗透测试与漏洞
• 合规与法律要求
• 威胁情报分析
• 安全架构设计`;
  }

  private handleInputKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.handleSendMessage();
    }
  }

  private renderChatContent() {
    const role = this.getRoleInfo();
    
    return html`
      <div class="chat-container">
        <div class="chat-messages">
          ${this.messages.length === 0 ? html`
            <div class="empty-chat">
              <div class="empty-chat-icon">${role.emoji}</div>
              <div class="empty-chat-title">${this.i18n.t('roles.' + this.selectedRoleId)}</div>
              <div class="empty-chat-desc">
                ${this.i18n.t('chat.startConversation') || '开始与AI安全专家对话'}
                <br /><br />
                <span style="opacity: 0.7;">${this.i18n.t('chat.tryAsk') || '试试问: "你的角色是什么?" 或 "你能做什么?"'}</span>
              </div>
            </div>
          ` : html`
            ${this.messages.map(msg => html`
              <div class="message ${msg.role}">
                <div class="message-role">
                  ${msg.role === 'user' ? '👤 You' : `${role.emoji} ${this.i18n.t('roles.' + this.selectedRoleId)}`}
                </div>
                <div class="message-content">${msg.content}</div>
              </div>
            `)}
            ${this.isLoading ? html`
              <div class="message assistant">
                <div class="typing-indicator">
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                </div>
              </div>
            ` : ''}
          `}
        </div>
        <div class="chat-input-area">
          <textarea 
            class="chat-input"
            placeholder="${this.i18n.t('chat.inputPlaceholder') || '输入消息...'}"
            .value=${this.inputText}
            @input=${(e: InputEvent) => this.inputText = (e.target as HTMLTextAreaElement).value}
            @keydown=${this.handleInputKeydown}
            rows="1"
            ?disabled=${this.isLoading}
          ></textarea>
          <button 
            class="chat-send-btn" 
            @click=${this.handleSendMessage}
            ?disabled=${!this.inputText.trim() || this.isLoading}
          >
            ${this.i18n.t('chat.send') || '发送'}
          </button>
        </div>
      </div>
    `;
  }

  render() {
    // Read loading state to satisfy TS diagnostics even if not visually used in render
    void this.loading;
    const role = this.getRoleInfo();
    return html`
      <div class="page-container">
        <div class="roles-panel">
          <h2 class="roles-title">${this.i18n.t('nav.aiExperts')}</h2>
          ${ROLES.map(r => html`
            <div class="role-card ${this.selectedRoleId === r.id ? 'active' : ''}" @click=${() => this.handleRoleSelect(r.id)}>
              <span class="role-emoji">${r.emoji}</span>
              <div class="role-info">
                <div class="role-name">${this.i18n.t('roles.' + r.id)}</div>
                <div class="role-desc">${r.desc}</div>
              </div>
            </div>
          `)}
        </div>
        <div class="main-panel">
          <div class="selected-role-header">
            <span class="selected-role-emoji">${role.emoji}</span>
            <div><h2 style="margin:0">${this.i18n.t('roles.' + this.selectedRoleId)}</h2></div>
          </div>
          <div class="tabs">
            <div class="tab ${this.activeTab === 'skills' ? 'active' : ''}" @click=${() => this.handleTabChange('skills')}>Skills</div>
            <div class="tab ${this.activeTab === 'chat' ? 'active' : ''}" @click=${() => this.handleTabChange('chat')}>Chat</div>
          </div>
          <div class="content-area">
            ${this.activeTab === 'skills' ? this.renderSkillsContent() : this.renderChatContent()}
          </div>
          </div>
        </div>
      </div>
    `;
  }
}
