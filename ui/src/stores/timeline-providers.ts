/**
 * 内置工具的 Timeline Event Providers
 * 每个支持"自动导入"的插件提供风险事件数据
 * roleIds 限定该 provider 只对指定角色可见
 */

import { registerTimelineProvider, type TimelineEventProvider } from '../stores/timeline-store';

// ─── 架构师 ───

registerTimelineProvider({
  toolId: 'threat-model',
  toolName: '威胁建模 STRIDE',
  roleIds: ['security-architect'],
  getAutoEvents() {
    return [
      { label: 'STRIDE 建模：发现提权威胁', description: '容器逃逸提权(E)严重，需优先修复', priority: 'P1', time: '2026-04-18T09:30:00+08:00' },
      { label: 'STRIDE 建模：信息泄露风险', description: 'API 端点未鉴权，存在敏感数据泄露(I)', priority: 'P2', time: '2026-04-18T10:15:00+08:00' },
      { label: 'K8s 安全评审：容器逃逸风险确认', description: 'runC 漏洞 CVE-2024-21626，建议升级 runtime', priority: 'P1', time: '2026-04-01T14:00:00+08:00' },
    ];
  },
});

registerTimelineProvider({
  toolId: 'iam-config',
  toolName: 'IAM 配置审计',
  roleIds: ['security-architect', 'security-expert'],
  getAutoEvents() {
    return [
      { label: 'IAM 审计：2个权限过大账号', description: 'admin-service 账号拥有全局 admin 权限，建议最小权限化', priority: 'P1', time: '2026-04-05T11:20:00+08:00' },
      { label: 'IAM 审计：过期 Service Account', description: '3 个 SA 超过 90 天未轮转密钥', priority: 'P2', time: '2026-04-05T11:45:00+08:00' },
    ];
  },
});

registerTimelineProvider({
  toolId: 'zero-trust',
  toolName: '零信任评估',
  roleIds: ['security-architect'],
  getAutoEvents() {
    return [
      { label: '零信任评审：微隔离改进', description: '成熟度 3.0→3.2，微隔离覆盖率从 42% 提升至 58%', priority: 'P2', time: '2026-04-08T16:00:00+08:00' },
      { label: '零信任方案：设备信任策略更新', description: 'BYOD 设备信任等级下调，需补充 MFA', priority: 'P3', time: '2026-04-08T16:30:00+08:00' },
    ];
  },
});

registerTimelineProvider({
  toolId: 'cloud-security',
  toolName: '云安全评估',
  roleIds: ['security-architect'],
  getAutoEvents() {
    return [
      { label: 'CSPM 扫描：S3 桶策略风险', description: '12 项 S3 桶配置风险，3 项为公开访问', priority: 'P2', time: '2026-04-12T10:00:00+08:00' },
      { label: 'CSPM 扫描：安全组规则过宽', description: '4 个安全组开放 0.0.0.0/0 入站', priority: 'P1', time: '2026-04-12T10:30:00+08:00' },
    ];
  },
});

// ─── 合规检查（多角色共享） ───

registerTimelineProvider({
  toolId: 'compliance-chk',
  toolName: '合规检查',
  roleIds: ['ciso', 'privacy-officer', 'security-architect', 'supply-chain-security'],
  getAutoEvents() {
    return [
      { label: '等保自评：92% 通过', description: '等保 2.0 三级自评，8 项需整改', priority: 'P3', time: '2026-04-15T09:00:00+08:00' },
      { label: 'ISO27001 年度审计：待外部审核', description: '年度外部审核计划已确认，5 月 10 日开始', priority: 'INFO', time: '2026-04-20T08:00:00+08:00' },
    ];
  },
});

// ─── CISO ───

registerTimelineProvider({
  toolId: 'risk-score',
  toolName: '风险评分板',
  roleIds: ['ciso', 'secuclaw-commander', 'business-security-officer'],
  getAutoEvents() {
    return [
      { label: '风险评分更新：超过预警线', description: '综合风险评分 42→48，超过 45 预警线', priority: 'P2', time: '2026-04-19T12:55:00+08:00' },
    ];
  },
});

registerTimelineProvider({
  toolId: 'kpi-track',
  toolName: 'KPI 追踪',
  roleIds: ['ciso', 'business-security-officer'],
  getAutoEvents() {
    return [
      { label: 'KPI 更新：MTTD 超标', description: '平均检测时间 15min，目标 12min，需优化 SIEM 规则', priority: 'P2', time: '2026-04-17T10:00:00+08:00' },
      { label: 'KPI 达成：MTTR 达标', description: '平均响应时间 2.4h，目标 4h，表现良好', priority: 'P3', time: '2026-04-16T14:00:00+08:00' },
    ];
  },
});

registerTimelineProvider({
  toolId: 'board-report',
  toolName: '董事会报告',
  roleIds: ['ciso', 'secuclaw-commander'],
  getAutoEvents() {
    return [
      { label: 'Q2 安全态势报告待提交', description: '截止日期 4 月 25 日，需包含 APT 事件分析', priority: 'P2', time: '2026-04-19T09:00:00+08:00' },
    ];
  },
});

registerTimelineProvider({
  toolId: 'budget-dash',
  toolName: '预算仪表盘',
  roleIds: ['ciso'],
  getAutoEvents() {
    return [
      { label: '预算审查：技术投入超支预警', description: '安全工具采购超预算 12%，需追加审批', priority: 'P3', time: '2026-04-14T11:00:00+08:00' },
    ];
  },
});

// ─── 指挥官 ───

registerTimelineProvider({
  toolId: 'global-situation',
  toolName: '全域态势',
  roleIds: ['secuclaw-commander'],
  getAutoEvents() {
    return [
      { label: '全域态势：APT 组织活跃度上升', description: '检测到 APT29 相关 IOCs，涉及 3 个业务系统', priority: 'P1', time: '2026-04-18T08:30:00+08:00' },
      { label: '全域态势：角色健康度下降', description: '供应链安全角色评分降至 55，需关注', priority: 'P2', time: '2026-04-17T16:00:00+08:00' },
    ];
  },
});

registerTimelineProvider({
  toolId: 'ai-dispatch',
  toolName: 'AI 调度',
  roleIds: ['secuclaw-commander'],
  getAutoEvents() {
    return [
      { label: 'AI 调度：威胁情报聚合完成', description: '自动聚合 12 个情报源，发现 3 个高置信度威胁', priority: 'P2', time: '2026-04-19T10:00:00+08:00' },
    ];
  },
});

// ─── 安全运营 ───

registerTimelineProvider({
  toolId: 'alert-queue',
  toolName: '告警队列',
  roleIds: ['security-ops'],
  getAutoEvents() {
    return [
      { label: 'P1 告警：可疑进程已隔离', description: '主机 prod-web-03 检测到挖矿进程，已自动隔离', priority: 'P1', time: '2026-04-19T14:15:00+08:00' },
    ];
  },
});

registerTimelineProvider({
  toolId: 'soar-exec',
  toolName: 'SOAR 剧本',
  roleIds: ['security-ops'],
  getAutoEvents() {
    return [
      { label: 'SOAR：APT 隔离剧本执行中', description: '自动隔离 3 台受影响主机，等待人工确认', priority: 'P1', time: '2026-04-19T13:45:00+08:00' },
      { label: 'SOAR：钓鱼邮件处置完成', description: '自动删除 23 封钓鱼邮件，阻断发件域名', priority: 'P3', time: '2026-04-18T15:30:00+08:00' },
    ];
  },
});

registerTimelineProvider({
  toolId: 'log-analysis',
  toolName: '日志分析',
  roleIds: ['security-ops'],
  getAutoEvents() {
    return [
      { label: '日志分析：异常登录检测', description: '检测到 5 次非工作时间 VPN 登录，来源 IP 异常', priority: 'P2', time: '2026-04-19T02:15:00+08:00' },
    ];
  },
});

// ─── 事件管理（多角色共享） ───

registerTimelineProvider({
  toolId: 'incident-mgmt',
  toolName: '事件管理',
  roleIds: ['security-ops', 'secuclaw-commander', 'security-expert'],
  getAutoEvents() {
    return [
      { label: '事件：P1 横向移动告警', description: '检测到内网横向移动行为，疑似 APT 攻击链', priority: 'P1', time: '2026-04-19T14:05:00+08:00' },
      { label: '事件：P1 反向 Shell 检测', description: 'prod-db-01 主机检测到反弹 Shell 连接', priority: 'P1', time: '2026-04-19T13:58:00+08:00' },
    ];
  },
});

// ─── 安全专家 ───

registerTimelineProvider({
  toolId: 'vuln-scan',
  toolName: '漏洞扫描',
  roleIds: ['security-expert', 'security-ops'],
  getAutoEvents() {
    return [
      { label: '漏洞扫描：2 个高危 CVE', description: 'CVE-2024-3094 (XZ) 和 CVE-2024-27198 (TeamCity)', priority: 'P1', time: '2026-04-13T14:00:00+08:00' },
    ];
  },
});

registerTimelineProvider({
  toolId: 'threat-intel',
  toolName: '威胁情报',
  roleIds: ['security-ops', 'security-expert'],
  getAutoEvents() {
    return [
      { label: '威胁情报：T1059 命令执行活跃', description: '近期检测到大量 PowerShell 滥用行为', priority: 'P1', time: '2026-04-18T16:00:00+08:00' },
    ];
  },
});

registerTimelineProvider({
  toolId: 'pen-test',
  toolName: '渗透测试',
  roleIds: ['security-expert'],
  getAutoEvents() {
    return [
      { label: '渗透测试：Web 应用发现 SQL 注入', description: '用户搜索接口存在二次注入漏洞', priority: 'P1', time: '2026-04-16T14:00:00+08:00' },
      { label: '渗透测试：网络层发现 4 个开放高危端口', description: 'Redis 6379、MongoDB 27017 等未授权访问', priority: 'P2', time: '2026-04-16T15:30:00+08:00' },
    ];
  },
});

registerTimelineProvider({
  toolId: 'patch-mgmt',
  toolName: '补丁管理',
  roleIds: ['security-expert'],
  getAutoEvents() {
    return [
      { label: '补丁：Critical 级补丁 87% 已覆盖', description: '剩余 13% 为遗留系统，需手动处理', priority: 'P2', time: '2026-04-17T09:00:00+08:00' },
    ];
  },
});

// ─── 隐私官 ───

registerTimelineProvider({
  toolId: 'gdpr-audit',
  toolName: 'GDPR 审计',
  roleIds: ['privacy-officer'],
  getAutoEvents() {
    return [
      { label: 'GDPR 审计：DPIA 完成率 76%', description: 'Art.35 要求的 DPIA 评估仍有 5 项未完成', priority: 'P2', time: '2026-04-15T10:00:00+08:00' },
      { label: 'GDPR 审计：数据处理合规', description: 'Art.5 数据处理原则检查通过，无需整改', priority: 'P3', time: '2026-04-12T14:00:00+08:00' },
    ];
  },
});

registerTimelineProvider({
  toolId: 'data-map',
  toolName: '数据地图',
  roleIds: ['privacy-officer'],
  getAutoEvents() {
    return [
      { label: '数据地图：L4 数据集新增 3 个', description: '新发现 3 个包含个人敏感信息的数据集', priority: 'P2', time: '2026-04-18T11:00:00+08:00' },
    ];
  },
});

registerTimelineProvider({
  toolId: 'policy-mgmt',
  toolName: '策略管理',
  roleIds: ['privacy-officer'],
  getAutoEvents() {
    return [
      { label: '策略更新：Cookie 策略待更新', description: '新版 Cookie 同意要求生效，需更新隐私政策', priority: 'P2', time: '2026-04-14T09:00:00+08:00' },
      { label: '策略过期：数据保留策略已过期', description: '数据保留期限策略未更新超过 180 天', priority: 'P1', time: '2026-04-10T16:00:00+08:00' },
    ];
  },
});

// ─── 供应商评估（多角色共享） ───

registerTimelineProvider({
  toolId: 'vendor-eval',
  toolName: '供应商评估',
  roleIds: ['privacy-officer', 'business-security-officer', 'supply-chain-security'],
  getAutoEvents() {
    return [
      { label: '供应商评估：1 家高风险供应商', description: 'SolarWinds 安全评级 D，建议替换', priority: 'P1', time: '2026-04-16T09:00:00+08:00' },
    ];
  },
});

// ─── 业务安全 ───

registerTimelineProvider({
  toolId: 'bcp-mgmt',
  toolName: 'BCP 管理',
  roleIds: ['business-security-officer'],
  getAutoEvents() {
    return [
      { label: 'BCP 季度演练完成', description: 'RTO 达标率 92%，RPO 达标率 95%', priority: 'P3', time: '2026-04-11T14:00:00+08:00' },
      { label: 'BCP：核心系统 RTO 超标', description: '支付系统 RTO 实测 4.2h，目标 2h', priority: 'P1', time: '2026-04-11T16:30:00+08:00' },
    ];
  },
});

registerTimelineProvider({
  toolId: 'cost-calc',
  toolName: '成本计算',
  roleIds: ['business-security-officer'],
  getAutoEvents() {
    return [
      { label: '安全 ROI 更新：340%', description: '安全投入产出比良好，建议维持当前预算水平', priority: 'INFO', time: '2026-04-13T10:00:00+08:00' },
    ];
  },
});

// ─── 供应链 ───

registerTimelineProvider({
  toolId: 'sbom-scan',
  toolName: 'SBOM 扫描',
  roleIds: ['supply-chain-security'],
  getAutoEvents() {
    return [
      { label: 'SBOM 扫描：发现 3 个高危开源组件', description: 'XZ Utils 5.6.1、log4j 2.14.1、openssl 1.1.1', priority: 'P1', time: '2026-04-19T13:22:00+08:00' },
    ];
  },
});

registerTimelineProvider({
  toolId: 'third-party-risk',
  toolName: '第三方风险',
  roleIds: ['supply-chain-security'],
  getAutoEvents() {
    return [
      { label: '第三方风险：SolarWinds 评为 D 级', description: '供应链攻击历史 + 合规不达标，建议替换', priority: 'P1', time: '2026-04-16T09:00:00+08:00' },
      { label: '第三方风险：12 个高风险供应商需关注', description: '年度评估中 12 家供应商风险评分低于 C', priority: 'P2', time: '2026-04-14T14:00:00+08:00' },
    ];
  },
});

registerTimelineProvider({
  toolId: 'contract-review',
  toolName: '合同审查',
  roleIds: ['supply-chain-security'],
  getAutoEvents() {
    return [
      { label: '合同审查：3 份待审查合同', description: '金蝶 ERP 服务合同、阿里云 SLA 更新、CrowdStrike 续约', priority: 'P2', time: '2026-04-18T10:00:00+08:00' },
    ];
  },
});
