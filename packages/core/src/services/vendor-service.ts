/**
 * Vendor Service - In-memory vendor management with helper APIs
 *
 * Provides CRUD, risk assessment, risk matrix, and dependency graph data
 * for vendors. Seeds 5 sample vendors on first use.
 */
export interface Vendor {
  id: string;
  name: string;
  code: string;
  category: string;
  tier: string;
  riskScore: number;
  complianceStatus: string;
  contractExpiry: string;
  contactEmail: string;
  certifications: string[];
  assessmentScore: number;
  incidents: number;
  linkedAssets: string[];
  dependencies?: string[];
  createdAt: number;
  updatedAt: number;
}

export class VendorService {
  private vendors = new Map<string, Vendor>();
  private idSeq = 0;

  constructor() {
    this.seed();
  }

  private genId(): string {
    return `vendor_${Date.now()}_${++this.idSeq}`;
  }

  private seed(): void {
    if (this.vendors.size > 0) return;
    const now = Date.now();
    const data: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>[] = [
      { name: 'CloudShield Corp', code: 'CS-001', category: 'cloud', tier: 'critical', riskScore: 72, complianceStatus: 'compliant', contractExpiry: '2027-03-15', contactEmail: 'security@cloudshield.io', certifications: ['ISO27001', 'SOC2'], assessmentScore: 85, incidents: 1, linkedAssets: ['asset_server_01'] },
      { name: 'DataGuard Systems', code: 'DG-002', category: 'security', tier: 'important', riskScore: 58, complianceStatus: 'partial', contractExpiry: '2026-11-30', contactEmail: 'ops@dataguard.com', certifications: ['ISO27001'], assessmentScore: 70, incidents: 0, linkedAssets: [] },
      { name: 'NetFlow Analytics', code: 'NF-003', category: 'network', tier: 'critical', riskScore: 45, complianceStatus: 'compliant', contractExpiry: '2027-06-01', contactEmail: 'admin@netflow.io', certifications: ['SOC2', 'CSA'], assessmentScore: 90, incidents: 0, linkedAssets: ['asset_fw_01'] },
      { name: 'SafeHarbor Backup', code: 'SH-004', category: 'backup', tier: 'general', riskScore: 30, complianceStatus: 'compliant', contractExpiry: '2026-09-20', contactEmail: 'support@safeharbor.com', certifications: [], assessmentScore: 65, incidents: 0, linkedAssets: [] },
      { name: 'QuickSoft Solutions', code: 'QS-005', category: 'software', tier: 'important', riskScore: 85, complianceStatus: 'non-compliant', contractExpiry: '2026-05-01', contactEmail: 'dev@quicksoft.io', certifications: [], assessmentScore: 35, incidents: 3, linkedAssets: ['asset_app_03'] },
    ];
    for (const v of data) {
      const id = this.genId();
      this.vendors.set(id, { id, ...v, createdAt: now - 86400000, updatedAt: now });
    }
  }

  // Public helpers
  async list(params: Record<string, unknown> = {}): Promise<{ data: Vendor[]; pagination?: any }> {
    let results = Array.from(this.vendors.values());
    if (params.tier) results = results.filter(v => v.tier === params.tier);
    if (params.complianceStatus) results = results.filter(v => v.complianceStatus === params.complianceStatus);
    if (params.category) results = results.filter(v => v.category === params.category);

    // Pagination
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 20;
    const sortBy = (params as any).sortBy || 'updatedAt';
    const sortOrder = (params as any).sortOrder || 'desc';
    const sorted = [...results].sort((a, b) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });

    const total = sorted.length;
    const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);
    return {
      data: paginated,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async get(id: string): Promise<Vendor> {
    const v = this.vendors.get(id);
    if (!v) throw new Error('Vendor not found');
    return v;
  }

  async create(data: Partial<Vendor>): Promise<Vendor> {
    const id = this.genId();
    const now = Date.now();
    const v: Vendor = {
      id,
      name: (data.name || 'Untitled Vendor') as string,
      code: (data.code || 'UN-000') as string,
      category: (data.category || 'unknown') as string,
      tier: (data.tier || 'general') as string,
      riskScore: Number(data.riskScore) || 0,
      complianceStatus: (data.complianceStatus || 'unknown') as string,
      contractExpiry: (data.contractExpiry || new Date().toISOString().slice(0, 10)) as string,
      contactEmail: (data.contactEmail || '') as string,
      certifications: (data.certifications as string[]) || [],
      assessmentScore: Number(data.assessmentScore) || 0,
      incidents: Number(data.incidents) || 0,
      linkedAssets: (data.linkedAssets as string[]) || [],
      dependencies: data.dependencies,
      createdAt: now,
      updatedAt: now,
    };
    this.vendors.set(id, v);
    return v;
  }

  async update(id: string, data: Partial<Vendor>): Promise<Vendor> {
    const existing = this.vendors.get(id);
    if (!existing) throw new Error('Vendor not found');
    const updated = { ...existing, ...data, id, updatedAt: Date.now() } as Vendor;
    this.vendors.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.vendors.delete(id);
  }

  async assess(id: string): Promise<{ riskScore: number; breakdown: any }> {
    const v = this.vendors.get(id);
    if (!v) throw new Error('Vendor not found');
    const certScore = Math.min(v.certifications.length * 15, 100);
    const incScore = Math.max(0, 100 - v.incidents * 25);
    const riskScore = Math.round(certScore * 0.3 + v.assessmentScore * 0.4 + incScore * 0.3);
    const updated: Vendor = { ...v, riskScore, updatedAt: Date.now() };
    this.vendors.set(v.id, updated);
    return { riskScore, breakdown: { certifications: certScore, assessment: v.assessmentScore, incidentHistory: incScore } };
  }

  async riskMatrix(): Promise<Record<string, Vendor[]>> {
    const matrix: Record<string, Vendor[]> = { critical: [], important: [], general: [] };
    for (const v of this.vendors.values()) {
      const tier = v.tier;
      if (matrix[tier]) matrix[tier].push(v);
    }
    // sort by updatedAt desc for consistency
    Object.values(matrix).forEach(arr => arr.sort((a, b) => b.updatedAt - a.updatedAt));
    return matrix;
  }

  async dependencies(): Promise<{ vendors: Vendor[]; links: { from: string; to: string; type: string }[] }> {
    const all = Array.from(this.vendors.values());
    const ids = all.map(v => v.id);
    const links = ids.length >= 3 ? [
      { from: ids[0], to: ids[2], type: 'depends_on' },
      { from: ids[1], to: ids[4], type: 'integrates' },
      { from: ids[3], to: ids[0], type: 'backup_for' },
    ] : [] as any;
    return { vendors: all, links };
  }
}

export default VendorService;
