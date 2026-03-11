/**
 * sc-kpi-explain-drawer.ts
 * KPI Explanation Drawer
 * 
 * Provides explanations for KPI formulas and data sources
 */

import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { I18nController } from '../../../i18n/lib/lit-controller.js';
import type { DomainKPI, DomainId } from '../../capabilities-client.js';

interface KPIExplanation {
  id: string;
  name: string;
  formula: string;
  description?: string;
  currentValue?: number;
  threshold: number | string;
  unit: string;
  dataSource?: string;
  refreshPolicy?: string;
}

// Domain-specific KPI definitions from spec
const DOMAIN_KPI_DEFINITIONS: Record<DomainId, KPIExplanation[]> = {
  light: [
    { id: 'baseline-compliance', name: '基线合规率', formula: '合规项 / 总检查项 × 100%', threshold: 95, unit: '%' },
    { id: 'vuln-closure', name: '漏洞闭环率', formula: '关闭漏洞数 / 发现漏洞数 × 100%', threshold: 90, unit: '%' },
    { id: 'p1-mttr', name: 'P1事件MTTR', formula: '平均修复时间(分钟)', threshold: 240, unit: '分钟' },
  ],
  dark: [
    { id: 'auth-coverage', name: '授权覆盖率', formula: '已授权操作 / 总操作 × 100%', threshold: 100, unit: '%' },
    { id: 'unauthorized-exec', name: '越权执行', formula: '越权执行次数', threshold: 0, unit: '次' },
    { id: 'drill-review', name: '演练复盘完成率', formula: '复盘完成数 / 演练总数 × 100%', threshold: 100, unit: '%' },
  ],
  security: [
    { id: 'alert-effective', name: '告警有效率', formula: '有效告警数 / 总告警数 × 100%', threshold: 70, unit: '%' },
    { id: 'mttd', name: 'MTTD', formula: '平均检测时间(分钟)', threshold: 15, unit: '分钟' },
    { id: 'mitre-coverage', name: 'MITRE覆盖度', formula: '关键战术覆盖数 / 总战术数 × 100%', threshold: 80, unit: '%' },
  ],
  legal: [
    { id: 'high-risk-closure', name: '高风险条款闭环率', formula: '已整改高风险条款 / 总高风险条款 × 100%', threshold: 95, unit: '%' },
    { id: 'audit-pass', name: '审计一次通过率', formula: '一次通过审计项 / 总审计项 × 100%', threshold: 90, unit: '%' },
    { id: 'evidence-complete', name: '证据完备率', formula: '证据包完整数 / 总证据包 × 100%', threshold: 100, unit: '%' },
  ],
  technology: [
    { id: 'arch-defect-closure', name: '高风险架构缺陷关闭率', formula: '已关闭高风险架构缺陷 / 总架构缺陷 × 100%', threshold: 90, unit: '%' },
    { id: 'gate-effective', name: '门禁拦截有效率', formula: '有效拦截数 / 总拦截数 × 100%', threshold: 95, unit: '%' },
    { id: 'rto-rpo', name: 'RTO/RPO达标率', formula: '达标的RTO/RPO数量 / 总RTO/RPO数量 × 100%', threshold: 95, unit: '%' },
  ],
  business: [
    { id: 'biz-process-coverage', name: '高风险业务流程覆盖', formula: '已覆盖高风险业务流程 / 总业务流程 × 100%', threshold: 95, unit: '%' },
    { id: 'ale-coverage', name: 'ALE量化覆盖', formula: '已量化ALE的业务 / 总业务数 × 100%', threshold: 85, unit: '%' },
    { id: 'security-roi', name: '安全ROI可解释', formula: '(安全投入收益 / 总安全投入) × 100%', threshold: 100, unit: '%' },
  ],
};

