import { exec } from 'child_process';
import { promisify } from 'util';
import type { JsonStore } from '../storage/json-store.js';

const execAsync = promisify(exec);

export interface OpenCTIConfig {
  url: string;
  apiKey: string;
  syncIntervalMs: number;
  maxEntities: number;
}

export interface OpenCTIThreatActor {
  id: string;
  name: string;
  description: string;
  entity_type: string;
  sophistication: string;
  resource_level: string;
  primary_motivation: string;
  secondary_motivations: string[];
  goals: string[];
  targets: Array<{ name: string }>;
  externalReferences: Array<{ source_name: string; external_id: string; url: string }>;
}

export interface OpenCTIIndicator {
  id: string;
  name: string;
  description: string;
  pattern: string;
  pattern_type: string;
  valid_from: string;
  valid_until: string;
  x_opencti_score: number;
  indicator_types: string[];
}

export interface SecuClawThreatActor {
  id: string;
  source: 'opencti';
  sourceId: string;
  name: string;
  description: string;
  sophistication: string;
  motivation: string[];
  goals: string[];
  targets: string[];
  mitreTechniques: string[];
  indicators: Array<{ pattern: string; score: number; validFrom: number; validUntil: number }>;
  rawActor: OpenCTIThreatActor;
}

export class OpenCTIAdapter {
  constructor(private config: OpenCTIConfig, private store: JsonStore) {}

  async isAvailable(): Promise<boolean> {
    try {
      const result = await this.executeGraphQL('{ me { name } }');
      return !!result?.data?.me?.name;
    } catch {
      return false;
    }
  }

  async fetchThreatActors(): Promise<OpenCTIThreatActor[]> {
    const query = `
      query ThreatActors($first: Int) {
        threatActors(first: $first) {
          edges {
            node {
              id
              name
              description
              entity_type
              sophistication
              resource_level
              primary_motivation
              secondary_motivations
              goals
              targets {
                name
              }
              externalReferences {
                edges {
                  node {
                    source_name
                    external_id
                    url
                  }
                }
              }
            }
          }
        }
      }
    `;
    const result = await this.executeGraphQL(query, { first: this.config.maxEntities });
    const edges = result?.data?.threatActors?.edges ?? [];
    return edges.map((edge: any) => {
      const node = edge.node;
      const extRefEdges = node.externalReferences?.edges ?? [];
      return {
        ...node,
        externalReferences: extRefEdges.map((ref: any) => ref.node),
      };
    });
  }

  async fetchIndicators(forActorId?: string): Promise<OpenCTIIndicator[]> {
    const query = `
      query Indicators($first: Int, $filters: FilterGroup) {
        indicators(first: $first, filters: $filters) {
          edges {
            node {
              id
              name
              description
              pattern
              pattern_type
              valid_from
              valid_until
              x_opencti_score
              indicator_types
            }
          }
        }
      }
    `;
    const variables: Record<string, unknown> = { first: this.config.maxEntities };
    if (forActorId) {
      variables.filters = {
        mode: 'and',
        filters: [
          {
            key: 'indicates',
            values: [forActorId],
            operator: 'eq',
            mode: 'or',
          },
        ],
        filterGroups: [],
      };
    }
    const result = await this.executeGraphQL(query, variables);
    const edges = result?.data?.indicators?.edges ?? [];
    return edges.map((edge: any) => edge.node);
  }

  convertToThreatActor(actor: OpenCTIThreatActor, indicators: OpenCTIIndicator[]): SecuClawThreatActor {
    const motivation: string[] = [];
    if (actor.primary_motivation) {
      motivation.push(actor.primary_motivation);
    }
    if (actor.secondary_motivations?.length) {
      motivation.push(...actor.secondary_motivations);
    }

    return {
      id: `opencti-${actor.id}`,
      source: 'opencti',
      sourceId: actor.id,
      name: actor.name,
      description: actor.description ?? '',
      sophistication: actor.sophistication ?? '',
      motivation,
      goals: actor.goals ?? [],
      targets: (actor.targets ?? []).map((t) => t.name),
      mitreTechniques: this.extractMitre(actor.externalReferences ?? []),
      indicators: indicators.map((ind) => ({
        pattern: ind.pattern,
        score: ind.x_opencti_score ?? 0,
        validFrom: ind.valid_from ? new Date(ind.valid_from).getTime() : 0,
        validUntil: ind.valid_until ? new Date(ind.valid_until).getTime() : 0,
      })),
      rawActor: actor,
    };
  }

  async syncToStore(actors: SecuClawThreatActor[]): Promise<void> {
    await this.store.set('threat-intel/opencti-actors.json', actors);
  }

  async fullSync(): Promise<{ actors: number; indicators: number }> {
    const rawActors = await this.fetchThreatActors();
    const converted: SecuClawThreatActor[] = [];
    let totalIndicators = 0;

    for (const actor of rawActors) {
      const indicators = await this.fetchIndicators(actor.id);
      totalIndicators += indicators.length;
      converted.push(this.convertToThreatActor(actor, indicators));
    }

    await this.syncToStore(converted);

    return { actors: converted.length, indicators: totalIndicators };
  }

  private extractMitre(refs: Array<{ source_name: string; external_id: string }>): string[] {
    return refs
      .filter((ref) => ref.source_name === 'mitre-attack')
      .map((ref) => ref.external_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
  }

  private async executeGraphQL(query: string, variables?: Record<string, unknown>): Promise<any> {
    const body = JSON.stringify({ query, variables: variables ?? {} });
    const escapedBody = body.replace(/'/g, "'\\''");
    const escapedUrl = this.config.url.replace(/'/g, "'\\''");
    const escapedApiKey = this.config.apiKey.replace(/'/g, "'\\''");

    const command = `curl -s -X POST '${escapedUrl}' -H 'Content-Type: application/json' -H 'Authorization: Bearer ${escapedApiKey}' -d '${escapedBody}'`;

    const { stdout } = await execAsync(command, { maxBuffer: 50 * 1024 * 1024 });

    if (!stdout) {
      throw new Error('Empty response from OpenCTI');
    }

    const parsed = JSON.parse(stdout);

    if (parsed.errors?.length) {
      const messages = parsed.errors.map((e: any) => e.message).join('; ');
      throw new Error(`OpenCTI GraphQL errors: ${messages}`);
    }

    return parsed;
  }
}
