import type { LLMMessage } from './llm-types.js';

export interface RoleCapabilities {
  light: string[];
  dark: string[];
  security: string[];
  legal: string[];
  technology: string[];
  business: string[];
}

const ROLE_CAPABILITIES: Record<string, RoleCapabilities> = {
  'security-expert': {
    light: ['漏洞扫描', '补丁管理', '安全监控', '事件响应', '威胁检测', '访问控制', '加密管理', '身份认证'],
    dark: ['渗透测试', '红队演练', '漏洞利用', '权限提升', '横向移动', '数据窃取', '社会工程', '无线攻击'],
    security: ['风险评估', '威胁建模', '安全架构', '合规检查', '安全审计', '渗透测试', '代码审计', '恶意软件分析'],
    legal: [],
    technology: ['网络防御', '主机安全', '应用安全', '云安全', '容器安全', '密码学', '数字取证'],
    business: [],
  },
  'ciso': {
    light: ['安全战略规划', '合规治理', '安全架构设计', '风险管理', '安全预算管理', '监管对接', '安全政策制定', '安全绩效评估', '危机管理'],
    dark: ['合规漏洞挖掘', '监管渗透测试', '架构弱点评估', '法律风险分析', '合规绕过设计', '内部威胁检测', '高管攻击模拟', '供应链攻击评估'],
    security: ['威胁管理', '漏洞管理', '访问控制', '数据保护', '事件响应', '业务连续性', '身份管理', '安全审计'],
    legal: ['GDPR合规', 'CCPA合规', 'PIPL合规', '网络安全法', '数据保护法', '行业监管合规', '合同安全条款', '法律风险评估', '监管应对'],
    technology: ['基础设施安全', '应用安全', '云安全', '网络安全', '终端安全', '身份架构', '安全运营', 'DevSecOps'],
    business: ['战略规划', '预算管理', '跨部门协调', '董事会汇报', '投资决策', '供应商管理'],
  },
  'secuclaw-commander': {
    light: ['战略规划', '全面安全治理', '合规管理', '架构设计', '风险管理', '预算管理', '危机管理', '董事会汇报', '跨部门协调', '投资决策', '供应链管理', '安全运营', '业务连续性'],
    dark: ['全面渗透测试', '红队演练', 'APT模拟', '供应链攻击', '内部威胁评估', '高管攻击模拟', '合规渗透', '架构弱点分析', '法律风险评估', '业务中断攻击', '数据窃取模拟', '持久化评估'],
    security: ['威胁管理', '漏洞管理', '访问控制', '数据保护', '事件响应', '业务连续性', '身份管理', '安全审计', '风险评估', '合规管理', '安全架构', '安全运营'],
    legal: ['GDPR合规', 'CCPA合规', 'PIPL合规', '网络安全法', '数据保护法', '行业监管合规', '合同安全条款', '法律风险评估', '监管应对', '跨境数据传输', '隐私保护'],
    technology: ['基础设施安全', '应用安全', '云安全', '网络安全', '终端安全', '身份架构', '安全运营', 'DevSecOps', '数据安全', '容灾架构', '零信任架构'],
    business: ['战略规划', '预算管理', '跨部门协调', '董事会汇报', '投资决策', '供应商管理', '业务连续性', '风险管理', '供应链管理', '绩效管理', '团队建设'],
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
  'security-ops': {
    light: ['安全监控', '日志分析', '告警处理', '事件响应', '威胁猎杀', '安全编排'],
    dark: ['攻击检测', '威胁情报', '恶意软件分析', '入侵追踪'],
    security: ['SIEM运营', 'SOAR编排', 'EDR管理', 'NDR监控', '威胁检测', '事件响应', '取证分析'],
    legal: [],
    technology: ['SIEM', 'SOAR', 'EDR', 'NDR', '威胁情报平台', '漏洞扫描器'],
    business: ['运营效率', ' SLA管理', '团队协调'],
  },
  'auditor': {
    light: ['合规审计', '安全评估', '证据收集', '报告编写', '风险识别'],
    dark: ['审计证据验证', '控制测试', '合规差距分析'],
    security: ['安全控制评估', '渗透测试监督', '合规性检查'],
    legal: ['等保2.0', 'GDPR', 'ISO27001', 'SOC2'],
    technology: ['审计工具', '日志分析', '取证技术'],
    business: ['审计计划', '利益相关者沟通', '报告呈现'],
  },
};

const ROLE_PERSONAS: Record<string, { role: string; focus: string; style: string }> = {
  'security-expert': {
    role: '安全专家 (Security Expert)',
    focus: '技术细节、CVE/CVSS分析、利用场景、修复方案',
    style: '使用精确的安全术语，提供详细的技术分析和可操作的修复步骤',
  },
  'ciso': {
    role: '首席信息安全官 (CISO) 顾问',
    focus: '战略风险、合规管理、预算影响、高管汇报',
    style: '提供简洁的executive summary，强调业务影响和投资回报',
  },
  'secuclaw-commander': {
    role: '安全指挥官 (Security Commander)',
    focus: '全面态势感知、跨领域协调、战略决策支持',
    style: '综合分析多领域安全数据，提供全局视角的决策建议',
  },
  'privacy-officer': {
    role: '隐私官 (Privacy Officer) 顾问',
    focus: 'GDPR/CCPA/PIPL合规、数据保护、用户权利',
    style: '强调法规要求和合规流程，提供隐私保护建议',
  },
  'security-architect': {
    role: '安全架构师 (Security Architect) 顾问',
    focus: '零信任架构、安全设计、威胁建模、技术评审',
    style: '提供深度的技术架构分析和最佳实践建议',
  },
  'business-security-officer': {
    role: '业务安全官 (Business Security Officer) 顾问',
    focus: '业务连续性、风险转移、投资决策、ROI',
    style: '平衡安全投入与业务价值，提供管理视角的建议',
  },
  'security-ops': {
    role: '安全运营分析师 (Security Operations Analyst)',
    focus: '告警分类、响应手册、SLA合规、即时行动',
    style: '优先级明确，提供可直接执行的操作步骤和runbook',
  },
  'auditor': {
    role: '安全审计师 (Security Auditor)',
    focus: '合规证据、控制测试、审计发现、整改建议',
    style: '客观严谨，提供基于证据的分析和可验证的结论',
  },
};

const GENERIC_PERSONA = {
  role: '安全顾问 (Security Advisor)',
  focus: '综合安全分析、风险评估、建议提供',
  style: '提供平衡的技术和业务安全指导',
};

export class RolePersonaManager {
  private logger = {
    warn: (...args: any[]) => console.warn('[RolePersonaManager]', ...args),
  };

  getPersona(roleId: string): { role: string; focus: string; style: string } {
    return ROLE_PERSONAS[roleId] || {
      ...GENERIC_PERSONA,
      _warned: false,
    };
  }

  getCapabilities(roleId: string): RoleCapabilities | null {
    return ROLE_CAPABILITIES[roleId] || null;
  }

  buildSystemPrompt(roleId: string, additionalContext?: string): LLMMessage {
    const persona = this.getPersona(roleId);
    const capabilities = this.getCapabilities(roleId);

    let prompt = `You are a ${persona.role}.`;

    if (capabilities) {
      const capList: string[] = [];
      if (capabilities.security.length > 0) {
        capList.push(...capabilities.security.slice(0, 5));
      }
      if (capabilities.technology.length > 0) {
        capList.push(...capabilities.technology.slice(0, 3));
      }
      if (capabilities.legal.length > 0) {
        capList.push(...capabilities.legal.slice(0, 3));
      }
      if (capList.length > 0) {
        prompt += `\nYour key expertise areas include: ${capList.join(', ')}.`;
      }
    }

    prompt += `\n\nFocus areas: ${persona.focus}.`;
    prompt += `\n\nCommunication style: ${persona.style}.`;
    prompt += '\n\nAlways respond in Chinese (中文). Be concise and actionable.';

    if (additionalContext) {
      prompt += `\n\nCurrent context:\n${additionalContext}`;
    }

    if (!ROLE_PERSONAS[roleId] && !this.getCapabilities(roleId)) {
      this.logger.warn(`Unknown role: ${roleId}, using generic persona`);
    }

    return {
      role: 'system',
      content: prompt,
    };
  }
}
