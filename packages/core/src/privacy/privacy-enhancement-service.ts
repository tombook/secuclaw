import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type SensitivityLevel =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'top_secret';

export type PiiCategory =
  | 'name'
  | 'email'
  | 'phone'
  | 'address'
  | 'ssn'
  | 'credit_card'
  | 'passport'
  | 'date_of_birth'
  | 'medical'
  | 'biometric'
  | 'financial'
  | 'location'
  | 'ip_address'
  | 'device_id'
  | 'other';

export type AnonymizationMethod =
  | 'masking'
  | 'pseudonymization'
  | 'generalization'
  | 'differential_privacy'
  | 'tokenization'
  | 'suppression';

export type DsarStatus =
  | 'received'
  | 'verified'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'expired';

export type DsarType =
  | 'access'
  | 'deletion'
  | 'portability'
  | 'rectification'
  | 'restriction'
  | 'objection';

export type RetentionPolicy = 'delete' | 'archive' | 'anonymize' | 'review';

export interface DataClassificationResult {
  field: string;
  piiCategory: PiiCategory | null;
  sensitivityLevel: SensitivityLevel;
  confidence: number;
  detectedPatterns: string[];
}

export interface AnonymizationResult {
  original: string;
  anonymized: string;
  method: AnonymizationMethod;
  piiCategory: PiiCategory;
  reversible: boolean;
  token: string | null;
}

export interface DsarNote {
  id: string;
  author: string;
  content: string;
  createdAt: number;
}

export interface DsarFinding {
  id: string;
  dataSource: string;
  recordCount: number;
  summary: string;
  detectedAt: number;
}

export interface DsarDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  createdAt: number;
}

export interface DsarRequest {
  id: string;
  type: DsarType;
  status: DsarStatus;
  dataSubjectName: string;
  dataSubjectEmail: string;
  dataSubjectId: string;
  description: string;
  receivedAt: number;
  verifiedAt: number | null;
  completedAt: number | null;
  deadlineAt: number;
  assignedTo: string | null;
  notes: DsarNote[];
  findings: DsarFinding[];
  responseDocuments: DsarDocument[];
}

export interface RetentionRule {
  id: string;
  dataType: string;
  category: PiiCategory;
  policy: RetentionPolicy;
  retentionDays: number;
  legalBasis: string;
  autoExecute: boolean;
}

export interface CreateDsarParams {
  type: DsarType;
  dataSubjectName: string;
  dataSubjectEmail: string;
  dataSubjectId?: string;
  description: string;
  assignedTo?: string | null;
  deadlineAt?: number;
}

export interface DsarFilters {
  status?: DsarStatus;
  type?: DsarType;
  dataSubjectEmail?: string;
  assignedTo?: string;
}

const logger = {
  info: (...args: unknown[]) => console.log('[PrivacyEnhancementService]', ...args),
  warn: (...args: unknown[]) => console.warn('[PrivacyEnhancementService]', ...args),
  error: (...args: unknown[]) => console.error('[PrivacyEnhancementService]', ...args),
  debug: (...args: unknown[]) => console.log('[PrivacyEnhancementService:DEBUG]', ...args),
};

export class PrivacyEnhancementService {
  private dsarRequests: Map<string, DsarRequest> = new Map();
  private retentionRules: Map<string, RetentionRule> = new Map();
  private classificationHistory: DataClassificationResult[] = [];
  private anonymizationTokenMap: Map<string, { original: string; category: PiiCategory }> = new Map();
  private readonly store: JsonStore;

  private readonly piiPatterns: Map<PiiCategory, RegExp[]> = new Map([
    [
      'email',
      [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
      ],
    ],
    [
      'phone',
      [
        /^\+?[1-9]\d{1,14}$/,
        /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/,
        /\b1[3-9]\d{9}\b/,
      ],
    ],
    [
      'ssn',
      [/\b\d{3}-\d{2}-\d{4}\b/, /\b(?!000|666|9\d{2})\d{3}[- ](?!00)\d{2}[- ](?!0000)\d{4}\b/],
    ],
    [
      'credit_card',
      [
        /\b(?:4\d{3}|5[1-5]\d{2}|6011|3[47]\d{2})[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/,
        /\b\d{13,19}\b/,
      ],
    ],
    [
      'ip_address',
      [
        /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
        /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
      ],
    ],
    [
      'date_of_birth',
      [
        /\b(19|20)\d{2}[-/年.](0?[1-9]|1[0-2])[-/月.](0?[1-9]|[12]\d|3[01])\b/,
        /\b(0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])[-/](19|20)\d{2}\b/,
      ],
    ],
    [
      'passport',
      [
        /\b[A-PR-WY][0-9]{8}\b/,
        /\b[0-9]{9}\b/,
        /\b[A-Z]{1,2}[0-9]{6,9}\b/,
      ],
    ],
    [
      'medical',
      [
        /\b(icd-?10|icd-?9|cpt|snomed)[:\s#-]*[a-z0-9.-]+/i,
        /\b(diagnosis|prescription|patient|medication|disease|symptom|treatment|hospital|clinic)\b/i,
      ],
    ],
    [
      'biometric',
      [
        /\b(fingerprint|retina|iris|facial|voice|face[-_ ]?id|biometric|dna)\b/i,
      ],
    ],
    [
      'financial',
      [
        /\b(account|iban|swift|bic|routing)[-_\s#:]*[a-z0-9]+/i,
        /\b\d{8,17}\b/,
      ],
    ],
    [
      'location',
      [
        /\b(lat|latitude|lng|longitude|lon)[:= ]*-?\d+(\.\d+)?/i,
        /\b-?\d{1,3}\.\d+,\s*-?\d{1,3}\.\d+\b/,
      ],
    ],
    [
      'device_id',
      [
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        /\b(device|imei|udid|android[-_ ]?id|ios[-_ ]?id|advertising[-_ ]?id)[:= ]*[a-z0-9-]+/i,
      ],
    ],
    [
      'address',
      [
        /\b\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|路|街|号|区|市|省)\b/i,
      ],
    ],
    [
      'name',
      [
        /\b(first|last|full|given|family)[-_ ]?name\b/i,
        /^[\u4e00-\u9fa5]{2,4}$/,
      ],
    ],
    [
      'other',
      [
        /\b(chinese[-_ ]?id|身份证|身份证号|居民身份证)[:：\s]*[0-9xX]{15,18}\b/i,
        /\b[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/,
        /\b(mac|mac[-_ ]?address)[:= ]*([0-9a-fA-F]{2}[:-\s]?){5}[0-9a-fA-F]{2}\b/i,
      ],
    ],
  ]);

  private readonly sensitivityMapping: Map<PiiCategory, SensitivityLevel> = new Map([
    ['name', 'internal'],
    ['email', 'confidential'],
    ['phone', 'confidential'],
    ['address', 'confidential'],
    ['ssn', 'restricted'],
    ['credit_card', 'restricted'],
    ['passport', 'restricted'],
    ['date_of_birth', 'confidential'],
    ['medical', 'restricted'],
    ['biometric', 'top_secret'],
    ['financial', 'restricted'],
    ['location', 'confidential'],
    ['ip_address', 'internal'],
    ['device_id', 'confidential'],
    ['other', 'internal'],
  ]);

  private readonly fieldHints: Map<string, PiiCategory> = new Map([
    ['email', 'email'],
    ['email_address', 'email'],
    ['e-mail', 'email'],
    ['mail', 'email'],
    ['phone', 'phone'],
    ['phone_number', 'phone'],
    ['mobile', 'phone'],
    ['tel', 'phone'],
    ['telephone', 'phone'],
    ['ssn', 'ssn'],
    ['social_security', 'ssn'],
    ['social_security_number', 'ssn'],
    ['credit_card', 'credit_card'],
    ['creditcard', 'credit_card'],
    ['card_number', 'credit_card'],
    ['cc', 'credit_card'],
    ['ccn', 'credit_card'],
    ['passport', 'passport'],
    ['passport_number', 'passport'],
    ['dob', 'date_of_birth'],
    ['date_of_birth', 'date_of_birth'],
    ['birthday', 'date_of_birth'],
    ['birth_date', 'date_of_birth'],
    ['birthdate', 'date_of_birth'],
    ['medical', 'medical'],
    ['diagnosis', 'medical'],
    ['prescription', 'medical'],
    ['medication', 'medical'],
    ['biometric', 'biometric'],
    ['fingerprint', 'biometric'],
    ['face_id', 'biometric'],
    ['iban', 'financial'],
    ['bank_account', 'financial'],
    ['account_number', 'financial'],
    ['salary', 'financial'],
    ['income', 'financial'],
    ['latitude', 'location'],
    ['longitude', 'location'],
    ['lat', 'location'],
    ['lng', 'location'],
    ['lon', 'location'],
    ['coordinates', 'location'],
    ['ip', 'ip_address'],
    ['ip_address', 'ip_address'],
    ['ipaddr', 'ip_address'],
    ['device_id', 'device_id'],
    ['deviceid', 'device_id'],
    ['imei', 'device_id'],
    ['udid', 'device_id'],
    ['mac', 'ip_address'],
    ['mac_address', 'ip_address'],
    ['address', 'address'],
    ['street', 'address'],
    ['city', 'address'],
    ['zip', 'address'],
    ['zipcode', 'address'],
    ['postal_code', 'address'],
    ['first_name', 'name'],
    ['last_name', 'name'],
    ['full_name', 'name'],
    ['given_name', 'name'],
    ['family_name', 'name'],
    ['username', 'name'],
    ['id_card', 'other'],
    ['idcard', 'other'],
    ['national_id', 'other'],
    ['身份证', 'other'],
    ['身份证号', 'other'],
  ]);

  constructor(store: JsonStore) {
    this.store = store;
  }

  async initialize(): Promise<void> {
    await this.loadDsarRequests();
    await this.loadRetentionRules();
  }

  private async loadDsarRequests(): Promise<void> {
    try {
      const saved = await this.store.get<DsarRequest[]>('privacy/dsar-requests.json');
      if (saved && Array.isArray(saved)) {
        this.dsarRequests.clear();
        for (const req of saved) {
          this.dsarRequests.set(req.id, req);
        }
        logger.info(`Loaded ${saved.length} DSAR requests`);
      }
    } catch (error) {
      logger.warn('Could not load DSAR requests:', error);
    }
  }

  private async saveDsarRequests(): Promise<void> {
    const all = Array.from(this.dsarRequests.values());
    await this.store.set('privacy/dsar-requests.json', all);
  }

  private async loadRetentionRules(): Promise<void> {
    try {
      const saved = await this.store.get<RetentionRule[]>('privacy/retention-rules.json');
      if (saved && Array.isArray(saved)) {
        this.retentionRules.clear();
        for (const rule of saved) {
          this.retentionRules.set(rule.id, rule);
        }
        logger.info(`Loaded ${saved.length} retention rules`);
      }
    } catch (error) {
      logger.warn('Could not load retention rules:', error);
    }
  }

  private async saveRetentionRules(): Promise<void> {
    const all = Array.from(this.retentionRules.values());
    await this.store.set('privacy/retention-rules.json', all);
  }

  async classifyData(data: Record<string, unknown>): Promise<DataClassificationResult[]> {
    const results: DataClassificationResult[] = [];
    for (const [field, value] of Object.entries(data)) {
      const result = this.classifyField(field, value);
      results.push(result);
    }
    this.classificationHistory.push(...results);
    return results;
  }

  classifyField(fieldName: string, value: unknown): DataClassificationResult {
    const detectedPatterns: string[] = [];
    let bestCategory: PiiCategory | null = null;
    let bestConfidence = 0;

    const normalizedField = fieldName.toLowerCase().trim();
    const hintCategory = this.fieldHints.get(normalizedField);
    if (hintCategory) {
      bestCategory = hintCategory;
      bestConfidence = 0.95;
      detectedPatterns.push(`field_hint:${normalizedField}`);
    }

    if (value === null || value === undefined) {
      return {
        field: fieldName,
        piiCategory: bestCategory,
        sensitivityLevel: bestCategory ? this.sensitivityMapping.get(bestCategory) ?? 'internal' : 'public',
        confidence: bestCategory ? bestConfidence : 0,
        detectedPatterns,
      };
    }

    if (typeof value === 'string' && value.length > 0) {
      const patternEntries = Array.from(this.piiPatterns.entries());
      for (const [category, patterns] of patternEntries) {
        if (bestCategory === category) continue;
        for (const pattern of patterns) {
          if (pattern.test(value)) {
            detectedPatterns.push(`${category}:${pattern.source.slice(0, 40)}`);
            let patternConfidence = 0.7;
            if (pattern.test(value) && hintCategory === category) {
              patternConfidence = 0.99;
            } else if (hintCategory === category) {
              patternConfidence = Math.max(patternConfidence, 0.9);
            }
            if (category === 'email' && value.includes('@')) patternConfidence = Math.max(patternConfidence, 0.95);
            if (category === 'credit_card' && this.luhnCheck(value.replace(/[-\s]/g, ''))) {
              patternConfidence = Math.max(patternConfidence, 0.98);
            }
            if (category === 'ssn' && /^\d{3}-\d{2}-\d{4}$/.test(value)) {
              patternConfidence = Math.max(patternConfidence, 0.95);
            }
            if (patternConfidence > bestConfidence) {
              bestConfidence = patternConfidence;
              bestCategory = category;
            }
          }
        }
      }
    } else if (typeof value === 'number' && hintCategory) {
      bestConfidence = Math.max(bestConfidence, 0.6);
    }

    if (!bestCategory) {
      bestCategory = this.inferCategoryFromValue(value);
      if (bestCategory) {
        bestConfidence = Math.max(bestConfidence, 0.5);
        detectedPatterns.push(`inferred:${bestCategory}`);
      }
    }

    const sensitivityLevel = bestCategory
      ? this.sensitivityMapping.get(bestCategory) ?? 'internal'
      : 'public';

    return {
      field: fieldName,
      piiCategory: bestCategory,
      sensitivityLevel,
      confidence: Number(bestConfidence.toFixed(3)),
      detectedPatterns,
    };
  }

  private inferCategoryFromValue(value: unknown): PiiCategory | null {
    if (typeof value === 'string') {
      if (/^[\u4e00-\u9fa5]{2,4}$/.test(value.trim())) return 'name';
      if (/^[a-zA-Z\s.'-]{2,40}$/.test(value.trim()) && value.includes(' ')) return 'name';
    }
    return null;
  }

  private luhnCheck(cardNumber: string): boolean {
    if (!/^\d{13,19}$/.test(cardNumber)) return false;
    let sum = 0;
    let alt = false;
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let n = parseInt(cardNumber.charAt(i), 10);
      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  async anonymizeData(
    data: Record<string, unknown>,
    method: AnonymizationMethod = 'masking',
  ): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(data)) {
      if (typeof value === 'string' && value.length > 0) {
        const classification = this.classifyField(field, value);
        if (classification.piiCategory) {
          const anon = this.anonymizeField(value, classification.piiCategory, method);
          result[field] = anon.anonymized;
        } else {
          result[field] = value;
        }
      } else if (typeof value === 'number' && method === 'differential_privacy') {
        result[field] = this.addNoise(value, 1.0);
      } else {
        result[field] = value;
      }
    }
    return result;
  }

  anonymizeField(
    value: string,
    piiCategory: PiiCategory,
    method: AnonymizationMethod = 'masking',
  ): AnonymizationResult {
    const anonymized = this.applyAnonymization(value, method, piiCategory);
    let token: string | null = null;
    let reversible = false;
    if (method === 'pseudonymization' || method === 'tokenization') {
      token = `tok_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
      this.anonymizationTokenMap.set(token, { original: value, category: piiCategory });
      reversible = true;
    }
    return {
      original: value,
      anonymized,
      method,
      piiCategory,
      reversible,
      token,
    };
  }

  private applyAnonymization(
    value: string,
    method: AnonymizationMethod,
    piiCategory?: PiiCategory,
  ): string {
    switch (method) {
      case 'masking':
        return this.maskValue(value);
      case 'pseudonymization':
        return this.pseudonymize(value);
      case 'generalization':
        return this.generalize(value, piiCategory);
      case 'suppression':
        return '[REDACTED]';
      case 'tokenization':
        return `tok_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
      case 'differential_privacy':
        return '[DP_NOISE]';
      default:
        return this.maskValue(value);
    }
  }

  private maskValue(value: string): string {
    if (value.length <= 2) return '*'.repeat(value.length);
    if (value.length <= 4) {
      return value[0] + '*'.repeat(value.length - 2) + value[value.length - 1];
    }
    const visibleStart = Math.min(2, Math.floor(value.length / 4));
    const visibleEnd = Math.min(2, Math.floor(value.length / 4));
    return (
      value.slice(0, visibleStart) +
      '*'.repeat(value.length - visibleStart - visibleEnd) +
      value.slice(value.length - visibleEnd)
    );
  }

  private pseudonymize(value: string): string {
    const hash = this.simpleHash(value);
    return `pseudo_${hash.toString(36).padStart(8, '0')}`;
  }

  private generalize(value: string, category?: PiiCategory): string {
    if (category === 'date_of_birth') {
      const yearMatch = value.match(/(\d{4})/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1], 10);
        const decade = Math.floor(year / 10) * 10;
        return `${decade}s`;
      }
    }
    if (/\bage\b/i.test(value)) {
      return '30-39';
    }
    if (category === 'ip_address' || /^\d+\.\d+\.\d+\.\d+$/.test(value)) {
      const parts = value.split('.');
      return `${parts[0]}.${parts[1]}.x.x`;
    }
    if (category === 'address') {
      const tokens = value.split(/\s+/);
      if (tokens.length > 1) {
        return tokens.slice(0, Math.max(1, Math.floor(tokens.length / 2))).join(' ') + ' ***';
      }
      return '***';
    }
    if (category === 'location') {
      const match = value.match(/^(-?\d+\.\d+)/);
      if (match) {
        const num = parseFloat(match[1]);
        return `${(Math.round(num * 10) / 10).toFixed(1)}, ***`;
      }
    }
    if (/^\d+$/.test(value)) {
      return `[${value.length}-digit number]`;
    }
    return value.slice(0, Math.max(1, Math.floor(value.length / 2))) + '***';
  }

  private simpleHash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const chr = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return Math.abs(hash);
  }

  addNoise(value: number, epsilon: number): number {
    if (epsilon <= 0) return value;
    const scale = 1 / epsilon;
    const u1 = Math.random();
    const u2 = Math.random();
    const gaussian = Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
    return value + gaussian * scale;
  }

  async createDsarRequest(params: CreateDsarParams): Promise<DsarRequest> {
    const now = Date.now();
    const deadlineAt = params.deadlineAt ?? now + 30 * 24 * 60 * 60 * 1000;
    const request: DsarRequest = {
      id: this.generateId('dsar'),
      type: params.type,
      status: 'received',
      dataSubjectName: params.dataSubjectName,
      dataSubjectEmail: params.dataSubjectEmail,
      dataSubjectId: params.dataSubjectId ?? '',
      description: params.description,
      receivedAt: now,
      verifiedAt: null,
      completedAt: null,
      deadlineAt,
      assignedTo: params.assignedTo ?? null,
      notes: [],
      findings: [],
      responseDocuments: [],
    };
    this.dsarRequests.set(request.id, request);
    await this.saveDsarRequests();
    logger.info(`Created DSAR request ${request.id} of type ${request.type}`);
    return request;
  }

  async verifyDsarRequest(requestId: string): Promise<DsarRequest> {
    const request = await this.getDsarRequest(requestId);
    if (!request) {
      throw new Error(`DSAR request not found: ${requestId}`);
    }
    if (request.status !== 'received' && request.status !== 'expired') {
      throw new Error(`DSAR request cannot be verified from status: ${request.status}`);
    }
    const updated: DsarRequest = {
      ...request,
      status: 'verified',
      verifiedAt: Date.now(),
    };
    this.dsarRequests.set(updated.id, updated);
    await this.saveDsarRequests();
    return updated;
  }

  async processDsarRequest(requestId: string): Promise<DsarRequest> {
    const request = await this.getDsarRequest(requestId);
    if (!request) {
      throw new Error(`DSAR request not found: ${requestId}`);
    }
    if (request.status !== 'verified') {
      throw new Error(`DSAR request must be verified before processing (current: ${request.status})`);
    }
    const updated: DsarRequest = {
      ...request,
      status: 'in_progress',
    };
    this.dsarRequests.set(updated.id, updated);
    await this.saveDsarRequests();
    return updated;
  }

  async completeDsarRequest(
    requestId: string,
    findings: DsarFinding[],
    documents: DsarDocument[],
  ): Promise<DsarRequest> {
    const request = await this.getDsarRequest(requestId);
    if (!request) {
      throw new Error(`DSAR request not found: ${requestId}`);
    }
    const updated: DsarRequest = {
      ...request,
      status: 'completed',
      completedAt: Date.now(),
      findings,
      responseDocuments: documents,
    };
    this.dsarRequests.set(updated.id, updated);
    await this.saveDsarRequests();
    logger.info(`Completed DSAR request ${requestId}`);
    return updated;
  }

  async getDsarRequest(requestId: string): Promise<DsarRequest | null> {
    return this.dsarRequests.get(requestId) ?? null;
  }

  async listDsarRequests(filters?: DsarFilters): Promise<DsarRequest[]> {
    let results = Array.from(this.dsarRequests.values());
    if (filters) {
      if (filters.status) results = results.filter((r) => r.status === filters.status);
      if (filters.type) results = results.filter((r) => r.type === filters.type);
      if (filters.dataSubjectEmail) {
        const email = filters.dataSubjectEmail.toLowerCase();
        results = results.filter((r) => r.dataSubjectEmail.toLowerCase() === email);
      }
      if (filters.assignedTo) {
        results = results.filter((r) => r.assignedTo === filters.assignedTo);
      }
    }
    results.sort((a, b) => b.receivedAt - a.receivedAt);
    return results;
  }

  async getOverdueDsarRequests(): Promise<DsarRequest[]> {
    const now = Date.now();
    const all = Array.from(this.dsarRequests.values());
    return all.filter(
      (r) =>
        (r.status === 'received' || r.status === 'verified' || r.status === 'in_progress') &&
        r.deadlineAt < now,
    );
  }

  addRetentionRule(rule: Omit<RetentionRule, 'id'>): RetentionRule {
    const newRule: RetentionRule = {
      id: this.generateId('retention'),
      ...rule,
    };
    this.retentionRules.set(newRule.id, newRule);
    void this.saveRetentionRules();
    return newRule;
  }

  getRetentionRule(ruleId: string): RetentionRule | null {
    return this.retentionRules.get(ruleId) ?? null;
  }

  listRetentionRules(): RetentionRule[] {
    return Array.from(this.retentionRules.values());
  }

  async executeRetention(): Promise<{
    deleted: number;
    archived: number;
    anonymized: number;
    reviewed: number;
  }> {
    const summary = { deleted: 0, archived: 0, anonymized: 0, reviewed: 0 };
    const rules = Array.from(this.retentionRules.values());
    const now = Date.now();
    for (const rule of rules) {
      if (!rule.autoExecute) continue;
      const cutoff = now - rule.retentionDays * 24 * 60 * 60 * 1000;
      const eligible = this.classificationHistory.filter(
        (entry) =>
          entry.piiCategory === rule.category && this.looksStale(entry, cutoff),
      );
      switch (rule.policy) {
        case 'delete':
          summary.deleted += eligible.length;
          this.removeStaleEntries(eligible);
          break;
        case 'archive':
          summary.archived += eligible.length;
          break;
        case 'anonymize':
          summary.anonymized += eligible.length;
          break;
        case 'review':
          summary.reviewed += eligible.length;
          break;
      }
    }
    logger.info('Retention execution complete', summary);
    return summary;
  }

  private looksStale(entry: DataClassificationResult, cutoffMs: number): boolean {
    const ts = (entry as unknown as { detectedAt?: number }).detectedAt;
    if (typeof ts === 'number') return ts < cutoffMs;
    return true;
  }

  private removeStaleEntries(entries: DataClassificationResult[]): void {
    const fieldsToRemove = new Set(entries.map((e) => `${e.field}:${e.piiCategory}`));
    this.classificationHistory = this.classificationHistory.filter(
      (entry) => !fieldsToRemove.has(`${entry.field}:${entry.piiCategory}`),
    );
  }

  async getPrivacyDashboard(): Promise<{
    totalClassifications: number;
    piiFieldsCount: number;
    pendingDsars: number;
    overdueDsars: number;
    dataSubjectsCount: number;
    retentionRulesCount: number;
  }> {
    const totalClassifications = this.classificationHistory.length;
    const piiFieldsCount = this.classificationHistory.filter((c) => c.piiCategory !== null).length;
    const dsars = Array.from(this.dsarRequests.values());
    const pendingDsars = dsars.filter(
      (r) => r.status === 'received' || r.status === 'verified' || r.status === 'in_progress',
    ).length;
    const overdueDsars = (await this.getOverdueDsarRequests()).length;
    const dataSubjects = new Set(dsars.map((r) => r.dataSubjectEmail.toLowerCase()).filter(Boolean));
    return {
      totalClassifications,
      piiFieldsCount,
      pendingDsars,
      overdueDsars,
      dataSubjectsCount: dataSubjects.size,
      retentionRulesCount: this.retentionRules.size,
    };
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }
}