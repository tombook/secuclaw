import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const logger = {
  info: (...args: any[]) => console.log('[ScfLoader]', ...args),
  error: (...args: any[]) => console.error('[ScfLoader]', ...args),
  warn: (...args: any[]) => console.warn('[ScfLoader]', ...args),
};

interface ScfDomain {
  id: string;
  scfIdentifier: string;
  name: string;
  description: string;
}

interface ScfControl {
  id: string;
  scfNumber: string;
  name: string;
  description: string;
  domain: string;
  category: string;
  objectives?: string[];
}

interface ScfStats {
  controls: number;
  domains: number;
  categories: string[];
}

export class ScfLoader {
  private dataPath: string;
  private domains: Map<string, ScfDomain> = new Map();
  private controls: Map<string, ScfControl> = new Map();
  private controlsByDomain: Map<string, string[]> = new Map();

  constructor(dataPath: string) {
    this.dataPath = dataPath;
  }

  async load(): Promise<void> {
    // Load domains
    try {
      const domainsData = await readFile(join(this.dataPath, 'scf-domains-principles.json'), 'utf-8');
      const domains = JSON.parse(domainsData);
      
      for (const domain of domains) {
        const scfDomain: ScfDomain = {
          id: domain['SCF Identifier'] || domain.id,
          scfIdentifier: domain['SCF Identifier'] || '',
          name: domain['SCF Domain'] || domain.name || '',
          description: domain['Description'] || domain.description || '',
        };
        this.domains.set(scfDomain.id, scfDomain);
      }
    } catch (error) {
      logger.warn('Failed to load SCF domains:', error);
    }

    // Load controls
    try {
      const controlsData = await readFile(join(this.dataPath, 'scf-20254.json'), 'utf-8');
      const controls = JSON.parse(controlsData);

      for (const control of controls) {
        const scfControl: ScfControl = {
          id: control['SCF #'] || control.id,
          scfNumber: control['SCF #'] || '',
          name: control['Control'] || control.name || '',
          description: control['Control Description'] || control.description || '',
          domain: control['SCF Domain'] || control.domain || '',
          category: control['SCF Control'] || control.category || '',
          objectives: control['Control Objectives'] ? [control['Control Objectives']] : undefined,
        };

        this.controls.set(scfControl.id, scfControl);

        // Index by domain
        if (scfControl.domain) {
          if (!this.controlsByDomain.has(scfControl.domain)) {
            this.controlsByDomain.set(scfControl.domain, []);
          }
          this.controlsByDomain.get(scfControl.domain)!.push(scfControl.id);
        }
      }
    } catch (error) {
      logger.warn('Failed to load SCF controls:', error);
    }

    logger.info(`Loaded ${this.domains.size} domains, ${this.controls.size} controls`);
  }

  getDomains(): ScfDomain[] {
    return Array.from(this.domains.values());
  }

  getDomain(id: string): ScfDomain | undefined {
    return this.domains.get(id);
  }

  getControls(domainId?: string): ScfControl[] {
    if (!domainId) {
      return Array.from(this.controls.values());
    }

    const controlIds = this.controlsByDomain.get(domainId) || [];
    return controlIds.map((id) => this.controls.get(id)!).filter(Boolean);
  }

  getControl(id: string): ScfControl | undefined {
    return this.controls.get(id);
  }

  getStats(): ScfStats {
    const categories = new Set<string>();
    this.controls.forEach((control) => {
      if (control.category) categories.add(control.category);
    });

    return {
      controls: this.controls.size,
      domains: this.domains.size,
      categories: Array.from(categories),
    };
  }

  search(query: string): ScfControl[] {
    const results: ScfControl[] = [];
    const queryLower = query.toLowerCase();

    this.controls.forEach((control) => {
      const searchable = `${control.name} ${control.description} ${control.scfNumber} ${control.category}`.toLowerCase();
      if (searchable.includes(queryLower)) {
        results.push(control);
      }
    });

    return results;
  }
}
