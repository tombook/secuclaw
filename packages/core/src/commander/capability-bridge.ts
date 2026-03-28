import type { ExecutionContext } from './playbook-types.js';

export interface CapabilityDefinition {
  id: string;
  name: string;
  description: string;
  paramSchema?: Record<string, unknown>;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}

export class CapabilityBridge {
  private capabilities: Map<string, CapabilityDefinition> = new Map();

  registerCapability(capability: CapabilityDefinition): void {
    if (this.capabilities.has(capability.id)) {
      throw new Error(`Capability already registered: ${capability.id}`);
    }
    this.capabilities.set(capability.id, capability);
  }

  async invokeCapability(
    capabilityId: string,
    params: Record<string, unknown>,
    _context?: ExecutionContext,
  ): Promise<unknown> {
    const cap = this.capabilities.get(capabilityId);
    if (!cap) throw new Error(`Capability not found: ${capabilityId}`);

    try {
      const result = await cap.handler(params);
      return result;
    } catch (err) {
      throw new Error(`Capability ${capabilityId} execution failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  listCapabilities(): Array<Omit<CapabilityDefinition, 'handler'>> {
    return Array.from(this.capabilities.values()).map(({ handler: _, ...rest }) => rest);
  }

  getCapability(id: string): CapabilityDefinition | undefined {
    return this.capabilities.get(id);
  }

  unregisterCapability(id: string): boolean {
    return this.capabilities.delete(id);
  }
}
