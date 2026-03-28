import { LinkStore } from './link-store.js';

interface IncidentLike {
  id: string;
  title?: string;
  severity?: string;
  category?: string;
  affectedAssets?: string[];
  attackVector?: string;
  mitreTechniques?: string[];
}

export class AutoLinker {
  constructor(
    private linkStore: LinkStore,
  ) {}

  async autoLinkOnCreate(incident: IncidentLike): Promise<{ linked: number; details: string[] }> {
    const details: string[] = [];
    let linked = 0;

    if (incident.affectedAssets && incident.affectedAssets.length > 0) {
      for (const assetId of incident.affectedAssets) {
        await this.linkStore.linkResource(incident.id, 'asset', assetId, undefined, true);
        linked++;
        details.push(`asset:${assetId}`);
      }
    }

    if (incident.mitreTechniques && incident.mitreTechniques.length > 0) {
      for (const techId of incident.mitreTechniques) {
        await this.linkStore.linkResource(incident.id, 'threat', techId, undefined, true);
        linked++;
        details.push(`threat:${techId}`);
      }
    }

    if (incident.category === 'compliance_violation' && incident.severity === 'high') {
      await this.linkStore.linkResource(incident.id, 'compliance', `auto-compliance-${incident.id}`, undefined, true);
      linked++;
      details.push('compliance:auto');
    }

    return { linked, details };
  }
}
