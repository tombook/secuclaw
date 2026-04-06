import type { JsonStore } from '../storage/json-store.js';

const LINKS_KEY = 'ai-result-links.json';

export interface AiResult {
  id: string;
  text: string;
  references?: string[];
  resolvedReferences?: Array<{ id: string; url: string }>;
}

export function linkResults(
  results: AiResult[],
  resolver?: (ref: string) => string
): AiResult[] {
  const defaultResolver = (ref: string) => `https://docs.example.com/${ref}`;
  const resolve = resolver || defaultResolver;

  return results.map(result => ({
    ...result,
    resolvedReferences: (result.references || []).map(ref => ({
      id: ref,
      url: resolve(ref),
    })),
  }));
}

export interface TicketLink {
  linkId: string;
  aiResultId: string;
  ticketId: string;
  linkType: 'related' | 'caused' | 'resolved';
  confidence: number;
  createdAt: number;
}

export class ResultLinker {
  constructor(private store: JsonStore) {}

  async linkResultToTicket(
    aiResultId: string,
    ticketId: string,
    linkType: TicketLink['linkType'] = 'related',
    confidence = 0.5,
  ): Promise<TicketLink> {
    const links = await this.getAll();
    const link: TicketLink = {
      linkId: `link_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      aiResultId,
      ticketId,
      linkType,
      confidence,
      createdAt: Date.now(),
    };
    links.push(link);
    await this.store.set(LINKS_KEY, links);
    return link;
  }

  async getTicketLinks(ticketId: string): Promise<TicketLink[]> {
    const links = await this.getAll();
    return links.filter(l => l.ticketId === ticketId);
  }

  async getResultLinks(aiResultId: string): Promise<TicketLink[]> {
    const links = await this.getAll();
    return links.filter(l => l.aiResultId === aiResultId);
  }

  async removeLink(linkId: string): Promise<boolean> {
    const links = await this.getAll();
    const filtered = links.filter(l => l.linkId !== linkId);
    if (filtered.length === links.length) return false;
    await this.store.set(LINKS_KEY, filtered);
    return true;
  }

  async getStats(): Promise<{ totalLinks: number; byType: Record<string, number> }> {
    const links = await this.getAll();
    const byType: Record<string, number> = {};
    for (const link of links) {
      byType[link.linkType] = (byType[link.linkType] ?? 0) + 1;
    }
    return { totalLinks: links.length, byType };
  }

  private async getAll(): Promise<TicketLink[]> {
    const raw = await this.store.get<TicketLink[]>(LINKS_KEY);
    return raw ?? [];
  }
}
