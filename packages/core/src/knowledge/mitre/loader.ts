import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const logger = {
  info: (...args: any[]) => console.log('[MitreLoader]', ...args),
  error: (...args: any[]) => console.error('[MitreLoader]', ...args),
  warn: (...args: any[]) => console.warn('[MitreLoader]', ...args),
};

interface MitreTactic {
  id: string;
  external_id: string;
  name: string;
  description: string;
  shortname: string;
}

interface MitreTechnique {
  id: string;
  external_id: string;
  name: string;
  description: string;
  tactics: string[];
  platforms: string[];
  killChainPhases: string[];
}

interface MitreStats {
  techniques: number;
  tactics: number;
  enterprise: number;
  mobile: number;
  ics: number;
}

interface StixObject {
  type: string;
  id: string;
  name?: string;
  description?: string;
  external_references?: Array<{ external_id: string; source_name: string }>;
  kill_chain_phases?: Array<{ kill_chain_name: string; phase_name: string }>;
  x_mitre_platforms?: string[];
  x_mitre_shortname?: string;
}

export class MitreLoader {
  private dataPath: string;
  private tactics: Map<string, MitreTactic> = new Map();
  private techniques: Map<string, MitreTechnique> = new Map();
  private searchIndex: Map<string, { type: 'tactic' | 'technique'; id: string }> = new Map();

  constructor(dataPath: string) {
    this.dataPath = dataPath;
  }

  async loadAll(): Promise<void> {
    const files = ['enterprise-attack.json', 'mobile-attack.json', 'ics-attack.json'];

    for (const file of files) {
      try {
        const filePath = join(this.dataPath, file);
        await this.loadFile(filePath, file.replace('-attack.json', ''));
      } catch (error) {
        logger.warn(`Failed to load ${file}:`, error);
      }
    }

    this.buildSearchIndex();
    logger.info(`Loaded ${this.tactics.size} tactics, ${this.techniques.size} techniques`);
  }

  private async loadFile(filePath: string, source: string): Promise<void> {
    const content = await readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    if (!data.objects || !Array.isArray(data.objects)) {
      throw new Error('Invalid STIX format');
    }

    for (const obj of data.objects as StixObject[]) {
      if (obj.type === 'x-mitre-tactic') {
        this.parseTactic(obj);
      } else if (obj.type === 'attack-pattern') {
        this.parseTechnique(obj);
      }
    }
  }

  private parseTactic(obj: StixObject): void {
    const externalRef = obj.external_references?.find((r) => r.source_name === 'mitre-attack');
    
    const tactic: MitreTactic = {
      id: obj.id,
      external_id: externalRef?.external_id || '',
      name: obj.name || '',
      description: obj.description || '',
      shortname: obj.x_mitre_shortname || '',
    };

    this.tactics.set(obj.id, tactic);
  }

  private parseTechnique(obj: StixObject): void {
    const externalRef = obj.external_references?.find((r) => r.source_name === 'mitre-attack');
    const tactics = obj.kill_chain_phases
      ?.filter((p) => p.kill_chain_name === 'mitre-attack')
      .map((p) => p.phase_name) || [];

    const technique: MitreTechnique = {
      id: obj.id,
      external_id: externalRef?.external_id || '',
      name: obj.name || '',
      description: obj.description || '',
      tactics,
      platforms: obj.x_mitre_platforms || [],
      killChainPhases: obj.kill_chain_phases?.map((p) => p.phase_name) || [],
    };

    this.techniques.set(obj.id, technique);
  }

  private buildSearchIndex(): void {
    // Index tactics
    this.tactics.forEach((tactic, id) => {
      const key = `${tactic.name} ${tactic.description} ${tactic.external_id}`.toLowerCase();
      this.searchIndex.set(key, { type: 'tactic', id });
    });

    // Index techniques
    this.techniques.forEach((technique, id) => {
      const key = `${technique.name} ${technique.description} ${technique.external_id}`.toLowerCase();
      this.searchIndex.set(key, { type: 'technique', id });
    });
  }

  getTactics(): MitreTactic[] {
    return Array.from(this.tactics.values());
  }

  getTactic(id: string): MitreTactic | undefined {
    return this.tactics.get(id);
  }

  getTechniques(tacticId?: string): MitreTechnique[] {
    const all = Array.from(this.techniques.values());
    if (!tacticId) return all;
    return all.filter((t) => t.tactics.includes(tacticId));
  }

  getTechnique(id: string): MitreTechnique | undefined {
    return this.techniques.get(id);
  }

  getStats(): MitreStats {
    return {
      techniques: this.techniques.size,
      tactics: this.tactics.size,
      enterprise: 0, // Could be calculated from source tracking
      mobile: 0,
      ics: 0,
    };
  }

  search(query: string, type?: 'technique' | 'tactic' | 'all'): Array<MitreTactic | MitreTechnique> {
    const results: Array<MitreTactic | MitreTechnique> = [];
    const queryLower = query.toLowerCase();

    this.searchIndex.forEach((index, key) => {
      if (key.includes(queryLower)) {
        if (type === 'tactic' && index.type === 'tactic') {
          results.push(this.tactics.get(index.id)!);
        } else if (type === 'technique' && index.type === 'technique') {
          results.push(this.techniques.get(index.id)!);
        } else if (!type || type === 'all') {
          if (index.type === 'tactic') {
            results.push(this.tactics.get(index.id)!);
          } else {
            results.push(this.techniques.get(index.id)!);
          }
        }
      }
    });

    return results;
  }
}
