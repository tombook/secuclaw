/**
 * Knowledge Service - 知识库服务
 * 
 * 调用后端已实现的知识库API (MITRE ATT&CK & SCF)
 */
import { gatewayClient } from './gateway-client.js';

// ============ MITRE Types ============

export interface MitreTactic {
  id: string;
  name: string;
  nameCn: string;
  description: string;
  descriptionCn: string;
}

export interface MitreTechnique {
  id: string;
  tactic: string;
  name: string;
  nameCn: string;
  description: string;
  descriptionCn: string;
  platforms: string[];
  permissions: string[];
  impact: string;
}

export interface MitreStats {
  tacticCount: number;
  techniqueCount: number;
  coverage: number;
}

// ============ SCF Types ============

export interface ScfControl {
  id: string;
  domainId: string;
  controlNumber: string;
  title: string;
  titleCn: string;
  description: string;
  descriptionCn: string;
  category: string;
}

export interface ScfDomain {
  id: string;
  name: string;
  nameCn: string;
  description: string;
  descriptionCn: string;
  controlCount: number;
}

export interface ScfStats {
  domainCount: number;
  controlCount: number;
  coverage: number;
}

// ============ Knowledge Service ============

class KnowledgeService {
  // ==================== MITRE ATT&CK ====================

  async getMitreStats(): Promise<MitreStats> {
    return gatewayClient.request('knowledge.mitre.stats', {});
  }

  async getMitreTactics(): Promise<MitreTactic[]> {
    return gatewayClient.request('knowledge.mitre.tactics', {});
  }

  async getMitreTechniques(params: {
    tacticId?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<MitreTechnique[]> {
    return gatewayClient.request('knowledge.mitre.techniques', params);
  }

  async searchMitre(keyword: string): Promise<{
    tactics: MitreTactic[];
    techniques: MitreTechnique[];
  }> {
    return gatewayClient.request('knowledge.mitre.search', { keyword });
  }

  // ==================== SCF Controls ====================

  async getScfStats(): Promise<ScfStats> {
    return gatewayClient.request('knowledge.scf.stats', {});
  }

  async getScfDomains(): Promise<ScfDomain[]> {
    return gatewayClient.request('knowledge.scf.domains', {});
  }

  async getScfControls(params: {
    domainId?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<ScfControl[]> {
    return gatewayClient.request('knowledge.scf.controls', params);
  }

  async searchScf(keyword: string): Promise<{
    domains: ScfDomain[];
    controls: ScfControl[];
  }> {
    return gatewayClient.request('knowledge.scf.search', { keyword });
  }
}

export const knowledgeService = new KnowledgeService();

// ============ Mock Data (for fallback) ============

export const mockMitreTactics: MitreTactic[] = [
  { id: 'TA0043', name: 'Reconnaissance', nameCn: '侦察', description: 'Research targets', descriptionCn: '侦察目标' },
  { id: 'TA0042', name: 'Resource Development', nameCn: '资源开发', description: 'Develop resources', descriptionCn: '开发资源' },
  { id: 'TA0001', name: 'Initial Access', nameCn: '初始访问', description: 'Gain initial foothold', descriptionCn: '获得初步立足点' },
  { id: 'TA0002', name: 'Execution', nameCn: '执行', description: 'Run malicious code', descriptionCn: '运行恶意代码' },
  { id: 'TA0003', name: 'Persistence', nameCn: '持久化', description: 'Maintain access', descriptionCn: '维持访问' },
  { id: 'TA0004', name: 'Privilege Escalation', nameCn: '权限提升', description: 'Gain higher privileges', descriptionCn: '获得更高权限' },
  { id: 'TA0005', name: 'Defense Evasion', nameCn: '防御规避', description: 'Avoid detection', descriptionCn: '规避检测' },
  { id: 'TA0006', name: 'Credential Access', nameCn: '凭证访问', description: 'Steal credentials', descriptionCn: '窃取凭证' },
  { id: 'TA0007', name: 'Discovery', nameCn: '发现', description: 'Explore environment', descriptionCn: '探索环境' },
  { id: 'TA0008', name: 'Lateral Movement', nameCn: '横向移动', description: 'Move through network', descriptionCn: '网络内移动' },
  { id: 'TA0009', name: 'Collection', nameCn: '收集', description: 'Gather data', descriptionCn: '收集数据' },
  { id: 'TA0011', name: 'Command and Control', nameCn: '命令与控制', description: 'Control compromised systems', descriptionCn: '控制被入侵系统' },
  { id: 'TA0010', name: 'Exfiltration', nameCn: '数据泄露', description: 'Steal data', descriptionCn: '窃取数据' },
  { id: 'TA0040', name: 'Impact', nameCn: '影响', description: 'Encrypt/delete data', descriptionCn: '加密/删除数据' },
];

export const mockMitreTechniques: MitreTechnique[] = [
  { id: 'T1566', tactic: 'TA0001', name: 'Phishing', nameCn: '钓鱼攻击', description: 'Phishing attacks', descriptionCn: '钓鱼攻击', platforms: ['Windows', 'macOS', 'Linux'], permissions: ['User'], impact: 'Initial access' },
  { id: 'T1059', tactic: 'TA0002', name: 'Command and Scripting Interpreter', nameCn: '命令和脚本解释器', description: 'Execute commands', descriptionCn: '执行命令', platforms: ['Windows', 'macOS', 'Linux'], permissions: ['User'], impact: 'Execution' },
  { id: 'T1055', tactic: 'TA0004', name: 'Process Injection', nameCn: '进程注入', description: 'Inject into processes', descriptionCn: '注入到进程', platforms: ['Windows'], permissions: ['Admin'], impact: 'Privilege escalation' },
  { id: 'T1047', tactic: 'TA0002', name: 'Windows Management Instrumentation', nameCn: 'WMI', description: 'Use WMI for execution', descriptionCn: '使用WMI执行', platforms: ['Windows'], permissions: ['Admin'], impact: 'Execution' },
  { id: 'T1021', tactic: 'TA0008', name: 'Remote Services', nameCn: '远程服务', description: 'Remote desktop/services', descriptionCn: '远程桌面/服务', platforms: ['Windows'], permissions: ['User'], impact: 'Lateral movement' },
  { id: 'T1053', tactic: 'TA0003', name: 'Scheduled Task/Job', nameCn: '计划任务', description: 'Schedule tasks', descriptionCn: '计划任务', platforms: ['Windows', 'macOS', 'Linux'], permissions: ['Admin'], impact: 'Persistence' },
  { id: 'T1486', tactic: 'TA0040', name: 'Data Encrypted for Impact', nameCn: '数据加密影响', description: 'Ransomware encryption', descriptionCn: '勒索软件加密', platforms: ['Windows', 'Linux'], permissions: ['Admin'], impact: 'Impact' },
  { id: 'T1083', tactic: 'TA0007', name: 'File and Directory Discovery', nameCn: '文件和目录发现', description: 'Find files', descriptionCn: '查找文件', platforms: ['Windows', 'macOS', 'Linux'], permissions: ['User'], impact: 'Discovery' },
];

export const mockScfDomains = [
  { id: 'GOV', name: 'Governance', nameCn: '治理', description: 'Security governance', descriptionCn: '安全治理', controlCount: 15 },
  { id: 'TRM', name: 'Risk Management', nameCn: '风险管理', description: 'Risk management', descriptionCn: '风险管理', controlCount: 12 },
  { id: 'ASM', name: 'Asset Management', nameCn: '资产管理', description: 'Asset management', descriptionCn: '资产管理', controlCount: 10 },
  { id: 'IRM', name: 'Incident Response', nameCn: '事件响应', description: 'Incident response', descriptionCn: '事件响应', controlCount: 8 },
  { id: 'BRM', name: 'Business Continuity', nameCn: '业务连续性', description: 'Business continuity', descriptionCn: '业务连续性', controlCount: 10 },
  { id: 'HRS', name: 'Human Resources', nameCn: '人力资源', description: 'HR security', descriptionCn: '人力资源安全', controlCount: 8 },
  { id: 'PMS', name: 'Physical Security', nameCn: '物理安全', description: 'Physical security', descriptionCn: '物理安全', controlCount: 10 },
  { id: 'DMM', name: 'Data Management', nameCn: '数据管理', description: 'Data management', descriptionCn: '数据管理', controlCount: 12 },
];
