export interface MitreMapping {
  techniqueId: string;
  techniqueName: string;
}
export interface MitreEvent {
  type?: string;
  name?: string;
  details?: any;
}
/**
 * Lightweight, rule-based MITRE ATT&CK mapper.
 * This is intentionally simple and deterministic for Phase1.
 */
export function mapEventToMitre(event: MitreEvent): MitreMapping | null {
  const name = (event.name ?? '').toLowerCase();
  const type = (event.type ?? '').toLowerCase();

  if (name.includes('login') || type.includes('authentication')) {
    return { techniqueId: 'T1078', techniqueName: 'Valid Accounts' };
  }
  if (name.includes('phish') || name.includes('credential') || type.includes('credential-access')) {
    // Placeholder mapping for credential-related access
    return { techniqueId: 'T1552', techniqueName: 'Credential Access' };
  }
  if (name.includes('discover') || type.includes('discovery')) {
    return { techniqueId: 'T1069', techniqueName: 'Permission Groups Discovery' };
  }
  return null;
}
