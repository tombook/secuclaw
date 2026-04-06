import type { RouterDeps } from '../router.js';
import { RolesRepository } from '../../roles/repository.js';
import { RolesService } from '../../roles/service.js';

function getRolesService(deps: RouterDeps): RolesService {
  const repo = new RolesRepository(deps.jsonStore);
  return new RolesService(repo);
}

export function registerRolesCrudRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {

  handlers.set('roles.list', async (params) => {
    const svc = getRolesService(deps);
    const roles = await svc.listRoles({
      code: params.code as string | undefined,
      level: params.level != null ? Number(params.level) : undefined,
      isSystem: params.isSystem === true ? true : params.isSystem === false ? false : undefined,
      page: params.page != null ? Number(params.page) : undefined,
      pageSize: params.pageSize != null ? Number(params.pageSize) : undefined,
    });
    return { data: roles, total: roles.length };
  });

  handlers.set('roles.get', async (params) => {
    const { id } = params;
    if (!id) throw new Error('Missing required parameter: id');
    const svc = getRolesService(deps);
    const role = await svc.getRole(id as string);
    if (!role) throw new Error(`Role with id ${id} not found`);
    return role;
  });

  handlers.set('roles.getByCode', async (params) => {
    const { code } = params;
    if (!code) throw new Error('Missing required parameter: code');
    const svc = getRolesService(deps);
    const role = await svc.getRoleByCode(code as string);
    if (!role) throw new Error(`Role with code ${code} not found`);
    return role;
  });

  handlers.set('roles.create', async (params) => {
    const { name, code } = params;
    if (!name || !code) throw new Error('Role name and code are required');
    const svc = getRolesService(deps);
    const existing = await svc.getRoleByCode(code as string);
    if (existing) throw new Error(`Role with code "${code}" already exists`);
    return svc.createRole({
      name: name as string,
      code: code as string,
      description: params.description as string | undefined,
      permissions: (params.permissions as string[]) || [],
      level: (params.level as number) || 0,
    });
  });

  handlers.set('roles.update', async (params) => {
    const { id, ...updates } = params;
    if (!id) throw new Error('Missing required parameter: id');
    const svc = getRolesService(deps);
    const existing = await svc.getRole(id as string);
    if (!existing) throw new Error(`Role with id ${id} not found`);
    if (existing.isSystem) throw new Error('Cannot modify system roles');
    return svc.updateRole(id as string, updates as Record<string, unknown>);
  });

  handlers.set('roles.delete', async (params) => {
    const { id } = params;
    if (!id) throw new Error('Missing required parameter: id');
    const svc = getRolesService(deps);
    const existing = await svc.getRole(id as string);
    if (!existing) throw new Error(`Role with id ${id} not found`);
    if (existing.isSystem) throw new Error('Cannot delete system roles');
    const deleted = await svc.deleteRole(id as string);
    return { deleted };
  });

  handlers.set('roles.initialize', async () => {
    const svc = getRolesService(deps);
    await svc.initializeRoles();
    return { initialized: true };
  });

  handlers.set('roles.listUsers', async (params) => {
    const svc = getRolesService(deps);
    const users = await svc.listUsers({
      roleId: params.roleId as string | undefined,
      department: params.department as string | undefined,
      status: params.status as string | undefined,
      page: params.page != null ? Number(params.page) : undefined,
      pageSize: params.pageSize != null ? Number(params.pageSize) : undefined,
    });
    return { data: users, total: users.length };
  });

  handlers.set('roles.getUser', async (params) => {
    const { id } = params;
    if (!id) throw new Error('Missing required parameter: id');
    const svc = getRolesService(deps);
    const user = await svc.getUser(id as string);
    if (!user) throw new Error(`User with id ${id} not found`);
    const permissions = await svc.getUserPermissions(id as string);
    return { ...user, permissions };
  });

  handlers.set('roles.createUser', async (params) => {
    const { username, email } = params;
    if (!username || !email) throw new Error('Username and email are required');
    const svc = getRolesService(deps);
    const existing = await svc.getUserByUsername(username as string);
    if (existing) throw new Error(`User with username "${username}" already exists`);
    return svc.createUser({
      username: username as string,
      email: email as string,
      displayName: params.displayName as string | undefined,
      department: params.department as string | undefined,
      title: params.title as string | undefined,
      roleIds: (params.roleIds as string[]) || [],
      status: (params.status as 'active' | 'inactive' | 'disabled') || 'active',
    });
  });

  handlers.set('roles.updateUser', async (params) => {
    const { id, ...updates } = params;
    if (!id) throw new Error('Missing required parameter: id');
    const svc = getRolesService(deps);
    const existing = await svc.getUser(id as string);
    if (!existing) throw new Error(`User with id ${id} not found`);
    return svc.updateUser(id as string, updates as Record<string, unknown>);
  });

  handlers.set('roles.deleteUser', async (params) => {
    const { id } = params;
    if (!id) throw new Error('Missing required parameter: id');
    const svc = getRolesService(deps);
    const existing = await svc.getUser(id as string);
    if (!existing) throw new Error(`User with id ${id} not found`);
    const deleted = await svc.deleteUser(id as string);
    return { deleted };
  });

  handlers.set('roles.assignRole', async (params) => {
    const { userId, roleId } = params;
    if (!userId || !roleId) throw new Error('userId and roleId are required');
    const svc = getRolesService(deps);
    const user = await svc.getUser(userId as string);
    if (!user) throw new Error(`User with id ${userId} not found`);
    const role = await svc.getRole(roleId as string);
    if (!role) throw new Error(`Role with id ${roleId} not found`);
    return svc.assignRoleToUser(userId as string, roleId as string);
  });

  handlers.set('roles.removeRole', async (params) => {
    const { userId, roleId } = params;
    if (!userId || !roleId) throw new Error('userId and roleId are required');
    const svc = getRolesService(deps);
    const user = await svc.getUser(userId as string);
    if (!user) throw new Error(`User with id ${userId} not found`);
    return svc.removeRoleFromUser(userId as string, roleId as string);
  });

  handlers.set('roles.getUserPermissions', async (params) => {
    const { id } = params;
    if (!id) throw new Error('Missing required parameter: id');
    const svc = getRolesService(deps);
    const user = await svc.getUser(id as string);
    if (!user) throw new Error(`User with id ${id} not found`);
    const permissions = await svc.getUserPermissions(id as string);
    return { userId: id, permissions };
  });
}
