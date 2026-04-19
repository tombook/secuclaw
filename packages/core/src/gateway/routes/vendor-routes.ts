import type { RouterDeps } from '../router.js';
import VendorService from '../../services/vendor-service.js';

import type { Vendor } from '../../services/vendor-service.js';

export function registerVendorRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  _deps: RouterDeps
): void {
  const service = new VendorService();

  handlers.set('vendors.list', async (params) => {
    return service.list(params);
  });

  handlers.set('vendors.get', async (params) => {
    return service.get(params.id as string);
  });

  handlers.set('vendors.create', async (params) => {
    return service.create(params as Partial<Vendor>);
  });

  handlers.set('vendors.update', async (params) => {
    const id = params.id as string;
    return service.update(id, params as Partial<Vendor>);
  });

  handlers.set('vendors.delete', async (params) => {
    return service.delete(params.id as string);
  });

  handlers.set('vendors.assess', async (params) => {
    return service.assess(params.id as string);
  });

  handlers.set('vendors.riskMatrix', async () => {
    return service.riskMatrix();
  });

  handlers.set('vendors.dependencies', async () => {
    return service.dependencies();
  });
}
