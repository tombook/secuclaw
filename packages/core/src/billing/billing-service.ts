import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type BillingPlan = 'free' | 'starter' | 'professional' | 'enterprise' | 'mssp';
export type BillingCycle = 'monthly' | 'quarterly' | 'annual' | 'lifetime';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'paused' | 'expired';
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'void' | 'refunded';
export type PaymentMethod = 'card' | 'wire' | 'crypto' | 'invoice' | 'credit' | 'free';
export type Currency = 'USD' | 'CNY' | 'EUR' | 'GBP' | 'JPY' | 'HKD';

export interface Plan {
  id: string;
  code: BillingPlan;
  name: string;
  description: string;
  price: number;
  currency: Currency;
  features: string[];
  limits: { users: number; assets: number; incidents: number; apiCallsPerDay: number; storageGb: number; retentionDays: number };
  supportedCycles: BillingCycle[];
  trialDays: number;
  active: boolean;
  stripePriceId: string | null;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  planCode: BillingPlan;
  status: SubscriptionStatus;
  cycle: BillingCycle;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  trialEndsAt: number | null;
  cancelledAt: number | null;
  cancelAt: number | null;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  autoRenew: boolean;
  discount: { code: string; percent: number; expiresAt: number | null } | null;
  metadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface Invoice {
  id: string;
  number: string;
  tenantId: string;
  subscriptionId: string;
  amount: number;
  tax: number;
  total: number;
  currency: Currency;
  status: InvoiceStatus;
  issuedAt: number;
  dueAt: number;
  paidAt: number | null;
  paymentMethod: PaymentMethod | null;
  paymentReference: string | null;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number; amount: number }>;
  notes: string;
  metadata: Record<string, any>;
}

export interface UsageRecord {
  id: string;
  tenantId: string;
  metric: 'api_calls' | 'llm_calls' | 'storage_mb' | 'scans' | 'users' | 'assets' | 'incidents';
  value: number;
  timestamp: number;
  periodStart: number;
  periodEnd: number;
  cost: number;
  currency: Currency;
  metadata: Record<string, any>;
}

export interface BillingStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialing: number;
  pastDue: number;
  cancelled: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  outstandingAmount: number;
  byPlan: Record<BillingPlan, { count: number; mrr: number }>;
  byCurrency: Record<Currency, number>;
  invoicesByStatus: Record<InvoiceStatus, number>;
  averageRevenuePerTenant: number;
  churnRate: number;
}

const STORE_KEYS = {
  plans: 'billing/plans.json',
  subscriptions: 'billing/subscriptions.json',
  invoices: 'billing/invoices.json',
  usage: 'billing/usage.json',
};

function emptyPlanMap(): Record<BillingPlan, { count: number; mrr: number }> {
  return { free: { count: 0, mrr: 0 }, starter: { count: 0, mrr: 0 }, professional: { count: 0, mrr: 0 }, enterprise: { count: 0, mrr: 0 }, mssp: { count: 0, mrr: 0 } };
}
function emptyCurrencyMap(): Record<Currency, number> {
  return { USD: 0, CNY: 0, EUR: 0, GBP: 0, JPY: 0, HKD: 0 };
}
function emptyInvoiceMap(): Record<InvoiceStatus, number> {
  return { draft: 0, pending: 0, paid: 0, overdue: 0, void: 0, refunded: 0 };
}

export class BillingService {
  constructor(private store: JsonStore) {}

  async initializePlans(): Promise<Plan[]> {
    const existing = await this.store.get<Plan[]>(STORE_KEYS.plans);
    if (existing && existing.length > 0) return existing;
    const defaults: Plan[] = [
      { id: this.generateId('plan'), code: 'free', name: '免费版', description: '适合个人开发者和 PoC', price: 0, currency: 'USD', features: ['基础检测', '社区支持', '1GB 存储'], limits: { users: 3, assets: 100, incidents: 50, apiCallsPerDay: 1000, storageGb: 1, retentionDays: 7 }, supportedCycles: ['monthly'], trialDays: 0, active: true, stripePriceId: null },
      { id: this.generateId('plan'), code: 'starter', name: '入门版', description: '适合小团队', price: 99, currency: 'USD', features: ['高级检测', '邮件支持', '10GB 存储', '7 天数据保留'], limits: { users: 10, assets: 1000, incidents: 500, apiCallsPerDay: 10000, storageGb: 10, retentionDays: 7 }, supportedCycles: ['monthly', 'annual'], trialDays: 14, active: true, stripePriceId: 'price_starter_monthly' },
      { id: this.generateId('plan'), code: 'professional', name: '专业版', description: '适合中型企业', price: 499, currency: 'USD', features: ['完整检测套件', '工单支持', '100GB 存储', '30 天数据保留', 'RASP/DSPM/ITDR 全部能力'], limits: { users: 50, assets: 10000, incidents: 5000, apiCallsPerDay: 100000, storageGb: 100, retentionDays: 30 }, supportedCycles: ['monthly', 'quarterly', 'annual'], trialDays: 14, active: true, stripePriceId: 'price_professional_monthly' },
      { id: this.generateId('plan'), code: 'enterprise', name: '企业版', description: '适合大型企业', price: 2999, currency: 'USD', features: ['所有功能', '7x24 支持', '1TB 存储', '365 天数据保留', 'SLA 99.99%', '专属客户经理'], limits: { users: 500, assets: 100000, incidents: 50000, apiCallsPerDay: 1000000, storageGb: 1000, retentionDays: 365 }, supportedCycles: ['monthly', 'quarterly', 'annual'], trialDays: 30, active: true, stripePriceId: 'price_enterprise_monthly' },
      { id: this.generateId('plan'), code: 'mssp', name: 'MSSP 多租户版', description: '托管安全服务商', price: 9999, currency: 'USD', features: ['全部 + 多租户', '白标', 'API 访问', '10TB 存储', '不限数据保留', 'MSSP 专属功能'], limits: { users: -1, assets: -1, incidents: -1, apiCallsPerDay: -1, storageGb: 10000, retentionDays: -1 }, supportedCycles: ['quarterly', 'annual'], trialDays: 30, active: true, stripePriceId: 'price_mssp_monthly' },
    ];
    await this.store.set(STORE_KEYS.plans, defaults);
    return defaults;
  }

  async listPlans(filter?: { active?: boolean; code?: BillingPlan }): Promise<Plan[]> {
    let plans = await this.store.get<Plan[]>(STORE_KEYS.plans) || [];
    if (filter?.active !== undefined) plans = plans.filter((p) => p.active === filter.active);
    if (filter?.code) plans = plans.filter((p) => p.code === filter.code);
    return plans;
  }

  async getPlan(planId: string): Promise<Plan | null> {
    const plans = await this.listPlans();
    return plans.find((p) => p.id === planId) || null;
  }

  async createSubscription(params: { tenantId: string; planId: string; cycle: BillingCycle; paymentMethod?: PaymentMethod; couponCode?: string; autoRenew?: boolean }): Promise<Subscription> {
    const plan = await this.getPlan(params.planId);
    if (!plan) throw new Error('plan not found');
    const now = Date.now();
    const cycleMs = { monthly: 30 * 86400e3, quarterly: 90 * 86400e3, annual: 365 * 86400e3, lifetime: 100 * 365 * 86400e3 }[params.cycle];
    const cycleAmount = params.cycle === 'annual' ? plan.price * 10 : params.cycle === 'quarterly' ? plan.price * 2.5 : plan.price;
    let discount: Subscription['discount'] = null;
    if (params.couponCode) discount = { code: params.couponCode, percent: 10, expiresAt: now + 30 * 86400e3 };
    const sub: Subscription = {
      id: this.generateId('sub'),
      tenantId: params.tenantId,
      planId: plan.id,
      planCode: plan.code,
      status: plan.trialDays > 0 ? 'trialing' : 'active',
      cycle: params.cycle,
      currentPeriodStart: now,
      currentPeriodEnd: now + cycleMs,
      trialEndsAt: plan.trialDays > 0 ? now + plan.trialDays * 86400e3 : null,
      cancelledAt: null,
      cancelAt: null,
      amount: cycleAmount,
      currency: plan.currency,
      paymentMethod: params.paymentMethod || 'card',
      autoRenew: params.autoRenew !== false,
      discount,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };
    const subs = await this.loadSubscriptions();
    subs.push(sub);
    await this.store.set(STORE_KEYS.subscriptions, subs);
    if (sub.status === 'active' || sub.status === 'trialing') {
      await this.createInvoice({ tenantId: sub.tenantId, subscriptionId: sub.id, amount: sub.amount, currency: sub.currency, dueAt: now + 30 * 86400e3, lineItems: [{ description: `${plan.name} - ${params.cycle}`, quantity: 1, unitPrice: cycleAmount, amount: cycleAmount }] });
    }
    return sub;
  }

  async cancelSubscription(subscriptionId: string, immediate: boolean = false): Promise<boolean> {
    const subs = await this.loadSubscriptions();
    const idx = subs.findIndex((s) => s.id === subscriptionId);
    if (idx === -1) return false;
    subs[idx].cancelledAt = Date.now();
    subs[idx].cancelAt = immediate ? Date.now() : subs[idx].currentPeriodEnd;
    subs[idx].autoRenew = false;
    subs[idx].status = immediate ? 'cancelled' : 'active';
    subs[idx].updatedAt = Date.now();
    await this.store.set(STORE_KEYS.subscriptions, subs);
    return true;
  }

  async listSubscriptions(filter?: { tenantId?: string; status?: SubscriptionStatus; planCode?: BillingPlan }): Promise<Subscription[]> {
    let subs = await this.loadSubscriptions();
    if (filter?.tenantId) subs = subs.filter((s) => s.tenantId === filter.tenantId);
    if (filter?.status) subs = subs.filter((s) => s.status === filter.status);
    if (filter?.planCode) subs = subs.filter((s) => s.planCode === filter.planCode);
    return subs.sort((a, b) => b.createdAt - a.createdAt);
  }

  async createInvoice(params: { tenantId: string; subscriptionId: string; amount: number; currency: Currency; dueAt: number; lineItems: Invoice['lineItems']; taxRate?: number }): Promise<Invoice> {
    const taxRate = params.taxRate ?? 0.06;
    const tax = Math.round(params.amount * taxRate * 100) / 100;
    const total = Math.round((params.amount + tax) * 100) / 100;
    const invoice: Invoice = {
      id: this.generateId('inv'),
      number: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: params.tenantId,
      subscriptionId: params.subscriptionId,
      amount: params.amount,
      tax,
      total,
      currency: params.currency,
      status: 'pending',
      issuedAt: Date.now(),
      dueAt: params.dueAt,
      paidAt: null,
      paymentMethod: null,
      paymentReference: null,
      lineItems: params.lineItems,
      notes: '',
      metadata: {},
    };
    const all = await this.loadInvoices();
    all.push(invoice);
    if (all.length > 10000) all.splice(0, all.length - 10000);
    await this.store.set(STORE_KEYS.invoices, all);
    return invoice;
  }

  async payInvoice(invoiceId: string, paymentMethod: PaymentMethod, paymentReference: string): Promise<boolean> {
    const invoices = await this.loadInvoices();
    const idx = invoices.findIndex((i) => i.id === invoiceId);
    if (idx === -1) return false;
    invoices[idx].status = 'paid';
    invoices[idx].paidAt = Date.now();
    invoices[idx].paymentMethod = paymentMethod;
    invoices[idx].paymentReference = paymentReference;
    await this.store.set(STORE_KEYS.invoices, invoices);
    return true;
  }

  async listInvoices(filter?: { tenantId?: string; status?: InvoiceStatus; since?: number; limit?: number }): Promise<Invoice[]> {
    let invoices = await this.loadInvoices();
    if (filter?.tenantId) invoices = invoices.filter((i) => i.tenantId === filter.tenantId);
    if (filter?.status) invoices = invoices.filter((i) => i.status === filter.status);
    if (filter?.since !== undefined) invoices = invoices.filter((i) => i.issuedAt >= filter.since!);
    invoices.sort((a, b) => b.issuedAt - a.issuedAt);
    if (filter?.limit !== undefined) invoices = invoices.slice(0, filter.limit);
    return invoices;
  }

  async recordUsage(record: Omit<UsageRecord, 'id'>): Promise<UsageRecord> {
    const newRec: UsageRecord = { ...record, id: this.generateId('usage') };
    const all = await this.loadUsage();
    all.push(newRec);
    if (all.length > 100000) all.splice(0, all.length - 100000);
    await this.store.set(STORE_KEYS.usage, all);
    return newRec;
  }

  async getUsage(tenantId: string, periodStart?: number, periodEnd?: number): Promise<UsageRecord[]> {
    let usage = await this.loadUsage();
    usage = usage.filter((u) => u.tenantId === tenantId);
    if (periodStart !== undefined) usage = usage.filter((u) => u.periodEnd >= periodStart);
    if (periodEnd !== undefined) usage = usage.filter((u) => u.periodStart <= periodEnd);
    return usage;
  }

  async getStats(): Promise<BillingStats> {
    const subs = await this.loadSubscriptions();
    const invoices = await this.loadInvoices();
    const byPlan = emptyPlanMap();
    const byCurrency = emptyCurrencyMap();
    const invoicesByStatus = emptyInvoiceMap();
    let mrr = 0;
    let totalRevenue = 0;
    let outstandingAmount = 0;
    for (const s of subs) {
      byPlan[s.planCode].count++;
      if (s.status === 'active' || s.status === 'trialing') {
        const monthly = s.cycle === 'monthly' ? s.amount : s.cycle === 'quarterly' ? s.amount / 3 : s.cycle === 'annual' ? s.amount / 12 : 0;
        mrr += monthly;
        byPlan[s.planCode].mrr += monthly;
        byCurrency[s.currency] += s.amount;
      }
    }
    for (const i of invoices) {
      invoicesByStatus[i.status]++;
      if (i.status === 'paid') totalRevenue += i.total;
      else if (i.status === 'pending' || i.status === 'overdue') outstandingAmount += i.total;
    }
    const totalActive = subs.filter((s) => s.status === 'active' || s.status === 'trialing').length;
    const cancelled = subs.filter((s) => s.status === 'cancelled').length;
    return {
      totalSubscriptions: subs.length,
      activeSubscriptions: subs.filter((s) => s.status === 'active').length,
      trialing: subs.filter((s) => s.status === 'trialing').length,
      pastDue: subs.filter((s) => s.status === 'past_due').length,
      cancelled,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      monthlyRecurringRevenue: Math.round(mrr * 100) / 100,
      annualRecurringRevenue: Math.round(mrr * 12 * 100) / 100,
      outstandingAmount: Math.round(outstandingAmount * 100) / 100,
      byPlan,
      byCurrency,
      invoicesByStatus,
      averageRevenuePerTenant: totalActive > 0 ? Math.round((mrr / totalActive) * 100) / 100 : 0,
      churnRate: subs.length > 0 ? Math.round((cancelled / subs.length) * 10000) / 10000 : 0,
    };
  }

  private async loadSubscriptions(): Promise<Subscription[]> {
    return (await this.store.get<Subscription[]>(STORE_KEYS.subscriptions)) || [];
  }
  private async loadInvoices(): Promise<Invoice[]> {
    return (await this.store.get<Invoice[]>(STORE_KEYS.invoices)) || [];
  }
  private async loadUsage(): Promise<UsageRecord[]> {
    return (await this.store.get<UsageRecord[]>(STORE_KEYS.usage)) || [];
  }

  private generateId(prefix: string): string {
    return `${prefix}_${randomUUID()}`;
  }
}
