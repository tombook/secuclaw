export type Dj2Level = 1 | 2 | 3 | 4 | 5;

export interface Dj2Control {
  id: string;
  name: string;
  domain: string;
  level: Dj2Level;
  category: string;
  description: string;
}

const DJ2_TECH_DOMAINS = [
  '安全物理环境',
  '安全通信网络',
  '安全区域边界',
  '安全计算环境',
  '安全管理中心',
];

const DJ2_MGMT_DOMAINS = [
  '安全管理机构',
  '安全管理制度',
  '安全管理人员',
  '安全建设管理',
  '安全运维管理',
];

export const DJ2_DOMAINS = [...DJ2_TECH_DOMAINS, ...DJ2_MGMT_DOMAINS];

export const DJ2_CONTROLS: Dj2Control[] = [
  { id: 'L2-PES-01', name: '物理位置的选择', domain: '安全物理环境', level: 2, category: '技术要求', description: '机房应选择在具有防震、防风和防雨能力的建筑内' },
  { id: 'L2-PES-02', name: '物理访问控制', domain: '安全物理环境', level: 2, category: '技术要求', description: '机房出入口应配置电子门禁系统，鉴别记录进出人员' },
  { id: 'L2-PES-03', name: '防盗窃和防破坏', domain: '安全物理环境', level: 2, category: '技术要求', description: '应设置机房防盗报警系统或视频监控系统' },
  { id: 'L3-PES-04', name: '防雷击', domain: '安全物理环境', level: 3, category: '技术要求', description: '机房应设置防雷保安器，防止雷击电磁脉冲' },
  { id: 'L2-CNS-01', name: '网络架构', domain: '安全通信网络', level: 2, category: '技术要求', description: '应划分不同的网络区域并设置访问控制策略' },
  { id: 'L2-CNS-02', name: '通信传输', domain: '安全通信网络', level: 2, category: '技术要求', description: '应采用校验技术或密码技术保证通信过程中数据完整性' },
  { id: 'L3-CNS-03', name: '通信保密性', domain: '安全通信网络', level: 3, category: '技术要求', description: '应采用密码技术保证通信过程中数据的保密性' },
  { id: 'L2-CNS-04', name: '可信接入', domain: '安全通信网络', level: 2, category: '技术要求', description: '应能够对接入网络的设备进行身份验证' },
  { id: 'L2-ABS-01', name: '边界防护', domain: '安全区域边界', level: 2, category: '技术要求', description: '应保证跨越边界的访问和数据流通过边界设备控制' },
  { id: 'L2-ABS-02', name: '访问控制', domain: '安全区域边界', level: 2, category: '技术要求', description: '应在网络边界部署访问控制机制' },
  { id: 'L3-ABS-03', name: '入侵防范', domain: '安全区域边界', level: 3, category: '技术要求', description: '应在网络边界部署入侵检测系统' },
  { id: 'L2-ABS-04', name: '恶意代码防范', domain: '安全区域边界', level: 2, category: '技术要求', description: '应在关键网络节点处部署恶意代码检测和清除机制' },
  { id: 'L2-CES-01', name: '身份鉴别', domain: '安全计算环境', level: 2, category: '技术要求', description: '应对登录的用户进行身份标识和鉴别' },
  { id: 'L2-CES-02', name: '访问控制', domain: '安全计算环境', level: 2, category: '技术要求', description: '应根据管理用户的角色分配权限' },
  { id: 'L3-CES-03', name: '安全审计', domain: '安全计算环境', level: 3, category: '技术要求', description: '应启用安全审计功能，审计记录至少保存6个月' },
  { id: 'L2-CES-04', name: '入侵防范', domain: '安全计算环境', level: 2, category: '技术要求', description: '应能够检测到对重要服务器进行入侵的行为' },
  { id: 'L3-CES-05', name: '数据完整性', domain: '安全计算环境', level: 3, category: '技术要求', description: '应采用校验技术或密码技术保证重要数据完整性' },
  { id: 'L3-CES-06', name: '数据保密性', domain: '安全计算环境', level: 3, category: '技术要求', description: '应采用密码技术保证重要数据保密性' },
  { id: 'L2-CES-07', name: '数据备份恢复', domain: '安全计算环境', level: 2, category: '技术要求', description: '应提供重要数据的本地数据备份与恢复功能' },
  { id: 'L2-SMC-01', name: '系统管理', domain: '安全管理中心', level: 2, category: '技术要求', description: '应对网络链路、服务器等设备运行状况进行监测' },
  { id: 'L2-SMC-02', name: '审计管理', domain: '安全管理中心', level: 2, category: '技术要求', description: '应对分散在各个设备上的审计数据进行收集汇总' },
  { id: 'L3-SMC-03', name: '安全管理', domain: '安全管理中心', level: 3, category: '技术要求', description: '应对安全策略、安全配置等进行集中管理' },
  { id: 'L2-ORI-01', name: '机构设立', domain: '安全管理机构', level: 2, category: '管理要求', description: '应成立网络安全和信息化工作领导小组' },
  { id: 'L2-ORI-02', name: '岗位职责', domain: '安全管理机构', level: 2, category: '管理要求', description: '应设立网络安全管理工作的职能部门' },
  { id: 'L2-ORI-03', name: '沟通与合作', domain: '安全管理机构', level: 2, category: '管理要求', description: '应加强与公安机关、网络与信息安全机构的沟通合作' },
  { id: 'L2-POL-01', name: '安全策略', domain: '安全管理制度', level: 2, category: '管理要求', description: '应制定网络安全工作的总体方针和安全策略' },
  { id: 'L2-POL-02', name: '管理制度', domain: '安全管理制度', level: 2, category: '管理要求', description: '应建立安全管理制度并定期修订完善' },
  { id: 'L2-HRM-01', name: '人员录用', domain: '安全管理人员', level: 2, category: '管理要求', description: '应指定或授权专门的部门或人员负责人员录用' },
  { id: 'L2-HRM-02', name: '人员离岗', domain: '安全管理人员', level: 2, category: '管理要求', description: '应及时终止离岗人员的所有访问权限' },
  { id: 'L2-HRM-03', name: '安全意识教育', domain: '安全管理人员', level: 2, category: '管理要求', description: '应对各类人员进行安全意识教育和岗位技能培训' },
  { id: 'L2-BLD-01', name: '系统建设方案', domain: '安全建设管理', level: 2, category: '管理要求', description: '应根据系统的安全保护等级制定安全建设方案' },
  { id: 'L2-BLD-02', name: '产品采购', domain: '安全建设管理', level: 2, category: '管理要求', description: '应确保安全产品采购和使用符合国家有关规定' },
  { id: 'L2-Ops-01', name: '环境管理', domain: '安全运维管理', level: 2, category: '管理要求', description: '应指定专门的部门或人员负责机房安全管理工作' },
  { id: 'L2-Ops-02', name: '漏洞和风险管理', domain: '安全运维管理', level: 2, category: '管理要求', description: '应采取必要的措施识别安全漏洞和隐患并及时修复' },
  { id: 'L3-Ops-03', name: '应急预案', domain: '安全运维管理', level: 3, category: '管理要求', description: '应制定网络安全事件应急预案并定期演练' },
];

export function getControlsForLevel(level: Dj2Level): Dj2Control[] {
  return DJ2_CONTROLS.filter(c => c.level <= level);
}

export function getControlsByDomain(domain: string): Dj2Control[] {
  return DJ2_CONTROLS.filter(c => c.domain === domain);
}

export function generateDj2Regulation(level: Dj2Level) {
  const controls = getControlsForLevel(level);
  const domains = [...new Set(controls.map(c => c.domain))];
  return {
    id: `dj2-level${level}`,
    name: `等保${level}.0`,
    fullName: `信息安全技术 网络安全等级保护基本要求 (第${level}级)`,
    jurisdiction: 'CN',
    version: 'GB/T 22239-2019',
    effectiveDate: new Date('2019-12-01').getTime(),
    authority: '国家市场监督管理总局',
    controlFramework: {
      domains,
      totalControls: controls.length,
    },
    requirements: {
      mandatory: level >= 3,
      penalties: level >= 3 ? '行政处罚、责令整改' : '建议整改',
      auditCycle: level >= 3 ? 'annual' : 'biennial',
    },
    compliance: {
      score: 0,
      compliant: 0,
      partial: 0,
      nonCompliant: controls.length,
    },
  };
}
