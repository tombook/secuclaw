import type { RouterDeps } from '../router.js';

export function registerSecurityRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {
  async function getData<T>(key: string): Promise<T[]> {
    const data = await deps.jsonStore.get<T>(key);
    return Array.isArray(data) ? data : [];
  }

  async function setData<T>(key: string, data: T[]): Promise<void> {
    await deps.jsonStore.set(key, data);
  }

  const THREAT_STATUS_FLOW = ['active', 'investigating', 'mitigated', 'false-positive', 'closed'];

  // ==================== Threats (Read) ====================

  handlers.set('threats.list', async () => {
    const list = await getData('threats');
    // Data migration: ensure all threats have a status field
    let needsMigration = false;
    for (const t of list) {
      if (!(t as any).status) {
        (t as any).status = 'active';
        needsMigration = true;
      }
    }
    if (needsMigration) {
      await setData('threats', list);
    }
    return list;
  });

  handlers.set('threats.get', async (p) => {
    const { id } = p;
    const list = await getData('threats');
    return list.find((t: any) => t.id === id) || null;
  });

  handlers.set('threats.stats', async () => {
    const list = await getData('threats');
    const byStatus: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    for (const t of list) {
      const s = (t as any).status || 'active';
      const sev = (t as any).severity || 'unknown';
      byStatus[s] = (byStatus[s] || 0) + 1;
      bySeverity[sev] = (bySeverity[sev] || 0) + 1;
    }
    return { total: list.length, byStatus, bySeverity };
  });

  handlers.set('threats.search', async (p) => {
    const { keyword } = p;
    const list = await getData('threats');
    if (!keyword) return list;
    const kw = String(keyword).toLowerCase();
    return list.filter((t: any) =>
      JSON.stringify(t).toLowerCase().includes(kw)
    );
  });

  // ==================== Threats (Write) ====================

  handlers.set('threats.create', async (p) => {
    const { name, type, severity, confidence, source, ioc, mitreTechniques, description } = p;
    if (!name || !type) throw new Error('Missing required fields: name, type');
    const list = await getData('threats');
    const newThreat = {
      id: `threat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: String(name),
      type: String(type),
      severity: severity ? String(severity) : 'medium',
      confidence: confidence ? Number(confidence) : 50,
      source: source ? String(source) : 'manual',
      description: description ? String(description) : '',
      ioc: ioc || {},
      mitreTechniques: mitreTechniques || [],
      status: 'active',
      detectedAt: Date.now(),
      comments: [],
    };
    list.push(newThreat as any);
    await setData('threats', list);
    return newThreat;
  });

  handlers.set('threats.update', async (p) => {
    const { id, ...updates } = p;
    if (!id) throw new Error('Missing required field: id');
    const list = await getData('threats');
    const idx = list.findIndex((t: any) => t.id === id);
    if (idx === -1) throw new Error(`Threat not found: ${id}`);
    const allowed = ['name', 'description', 'severity', 'confidence', 'ioc', 'mitreTechniques', 'type', 'source'];
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        (list[idx] as any)[key] = updates[key];
      }
    }
    (list[idx] as any).updatedAt = Date.now();
    await setData('threats', list);
    return list[idx];
  });

  handlers.set('threats.delete', async (p) => {
    const { id } = p;
    if (!id) throw new Error('Missing required field: id');
    const list = await getData('threats');
    const filtered = list.filter((t: any) => t.id !== id);
    if (filtered.length === list.length) throw new Error(`Threat not found: ${id}`);
    await setData('threats', filtered);
    return { success: true, id };
  });

  handlers.set('threats.updateStatus', async (p) => {
    const { id, status, comment } = p;
    if (!id || !status) throw new Error('Missing required fields: id, status');
    if (!THREAT_STATUS_FLOW.includes(String(status))) {
      throw new Error(`Invalid status: ${status}. Allowed: ${THREAT_STATUS_FLOW.join(', ')}`);
    }
    const list = await getData('threats');
    const idx = list.findIndex((t: any) => t.id === id);
    if (idx === -1) throw new Error(`Threat not found: ${id}`);
    const currentStatus = (list[idx] as any).status || 'active';
    const currentIdx = THREAT_STATUS_FLOW.indexOf(currentStatus);
    const newIdx = THREAT_STATUS_FLOW.indexOf(String(status));
    if (newIdx < currentIdx) {
      throw new Error(`Cannot move status backward: ${currentStatus} → ${status}`);
    }
    (list[idx] as any).status = String(status);
    (list[idx] as any).updatedAt = Date.now();
    if (comment) {
      const comments = (list[idx] as any).comments || [];
      comments.push({ text: String(comment), at: Date.now() });
      (list[idx] as any).comments = comments;
    }
    await setData('threats', list);
    return list[idx];
  });

  // ==================== Compliance (Read) ====================

  const COMPLIANCE_FRAMEWORKS = ['gdpr', 'iso27001', 'pipl', 'dengbao', 'soc2', 'pci-dss', 'custom'];
  const COMPLIANCE_STATUSES = ['compliant', 'non-compliant', 'partially-compliant', 'not-assessed'];

  handlers.set('compliance.list', async () => {
    const list = await getData('compliance');
    let needsMigration = false;
    for (const c of list) {
      if (!(c as any).framework) { (c as any).framework = 'custom'; needsMigration = true; }
      if (!(c as any).status) { (c as any).status = 'not-assessed'; needsMigration = true; }
    }
    if (needsMigration) { await setData('compliance', list); }
    return list;
  });

  handlers.set('compliance.get', async (p) => {
    const { id } = p;
    const list = await getData('compliance');
    return list.find((c: any) => c.id === id) || null;
  });

  handlers.set('compliance.stats', async () => {
    const list = await getData('compliance');
    const byFramework: Record<string, number> = {};
    const counts = { compliant: 0, nonCompliant: 0, partiallyCompliant: 0, notAssessed: 0 };
    for (const c of list) {
      const st = (c as any).status || 'not-assessed';
      const fw = (c as any).framework || 'custom';
      if (st === 'compliant') counts.compliant++;
      else if (st === 'non-compliant') counts.nonCompliant++;
      else if (st === 'partially-compliant') counts.partiallyCompliant++;
      else counts.notAssessed++;
      byFramework[fw] = (byFramework[fw] || 0) + 1;
    }
    const total = list.length;
    const complianceRate = total > 0 ? Math.round((counts.compliant / total) * 100) : 0;
    return { total, ...counts, byFramework, complianceRate };
  });

  // ==================== Compliance (Write) ====================

  handlers.set('compliance.create', async (p) => {
    const { name, framework, description, status, owner, department, evidence, dueDate } = p;
    if (!name || !framework) throw new Error('Missing required fields: name, framework');
    if (!COMPLIANCE_FRAMEWORKS.includes(String(framework))) {
      throw new Error(`Invalid framework: ${framework}. Allowed: ${COMPLIANCE_FRAMEWORKS.join(', ')}`);
    }
    const list = await getData('compliance');
    const newItem = {
      id: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: String(name),
      framework: String(framework),
      description: description ? String(description) : '',
      status: status && COMPLIANCE_STATUSES.includes(String(status)) ? String(status) : 'not-assessed',
      owner: owner ? String(owner) : '',
      department: department ? String(department) : '',
      evidence: evidence ? String(evidence) : '',
      dueDate: dueDate ? String(dueDate) : '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    list.push(newItem as any);
    await setData('compliance', list);
    return newItem;
  });

  handlers.set('compliance.update', async (p) => {
    const { id, ...updates } = p;
    if (!id) throw new Error('Missing required field: id');
    const list = await getData('compliance');
    const idx = list.findIndex((c: any) => c.id === id);
    if (idx === -1) throw new Error(`Compliance item not found: ${id}`);
    const allowed = ['name', 'description', 'framework', 'status', 'owner', 'department', 'evidence', 'dueDate'];
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        if (key === 'framework' && !COMPLIANCE_FRAMEWORKS.includes(String(updates[key]))) {
          throw new Error(`Invalid framework: ${updates[key]}`);
        }
        if (key === 'status' && !COMPLIANCE_STATUSES.includes(String(updates[key]))) {
          throw new Error(`Invalid status: ${updates[key]}`);
        }
        (list[idx] as any)[key] = updates[key];
      }
    }
    (list[idx] as any).updatedAt = Date.now();
    await setData('compliance', list);
    return list[idx];
  });

  handlers.set('compliance.delete', async (p) => {
    const { id } = p;
    if (!id) throw new Error('Missing required field: id');
    const list = await getData('compliance');
    const filtered = list.filter((c: any) => c.id !== id);
    if (filtered.length === list.length) throw new Error(`Compliance item not found: ${id}`);
    await setData('compliance', filtered);
    return { success: true, id };
  });
}
