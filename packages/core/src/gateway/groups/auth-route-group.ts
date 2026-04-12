import { RouteGroup } from './route-group.js';

import type { ServiceFactory } from '../services/service-factory.js';

export class AuthRouteGroup extends RouteGroup {
  constructor(private factory: ServiceFactory) {
    super();
  }

  register(): void {
    this.registerHandler('auth.login', this.login.bind(this));
    this.registerHandler('auth.logout', this.logout.bind(this));
    this.registerHandler('auth.refresh', this.refresh.bind(this));
  }

  private async login(params: Record<string, unknown>): Promise<unknown> {
    const { username, password } = params as { username: string; password: string };
    const rolesService = this.factory.getRolesService();
    const user = await rolesService.getUserByUsername(username);
    
    if (!user) {
      return { error: { code: 'AUTH_FAILED', message: 'Invalid credentials' } };
    }
    
    return { result: { userId: user.id, username: user.username } };
  }

  private async logout(params: Record<string, unknown>): Promise<unknown> {
    return { result: { success: true } };
  }

  private async refresh(params: Record<string, unknown>): Promise<unknown> {
    return { result: { token: 'refreshed-token' } };
  }
}
