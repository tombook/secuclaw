/**
 * Roles Routes
 * RESTful API for role and user management
 */

import { Router, Request, Response, NextFunction } from 'express';
import { RolesService } from '../../roles/service.js';
import { RolesRepository } from '../../roles/repository.js';
import { JsonStore } from '../../storage/json-store.js';
import { ApiError, ErrorCodes, successResponse, PaginatedResponse } from '../types.js';

const router = Router();

// Initialize service
const jsonStore = new JsonStore('./data/storage');
const rolesRepo = new RolesRepository(jsonStore);
const rolesService = new RolesService(rolesRepo);

/**
 * GET /api/v1/roles - List roles
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, level, isSystem, page = '1', pageSize = '20' } = req.query;

    const roles = await rolesService.listRoles({
      code: code as string,
      level: level !== undefined ? parseInt(level as string, 10) : undefined,
      isSystem: isSystem === 'true' ? true : isSystem === 'false' ? false : undefined,
      page: parseInt(page as string, 10),
      pageSize: parseInt(pageSize as string, 10),
    });

    res.json(successResponse(roles, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/roles/system - Get system roles
 */
router.get('/system', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await rolesService.listRoles({ isSystem: true });
    res.json(successResponse(roles, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/roles/:id - Get role by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const role = await rolesService.getRole(id);

    if (!role) {
      throw new ApiError(ErrorCodes.ROLE_NOT_FOUND, `Role with id ${id} not found`, 404);
    }

    res.json(successResponse(role, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/roles/code/:code - Get role by code
 */
router.get('/code/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const role = await rolesService.getRoleByCode(code);

    if (!role) {
      throw new ApiError(ErrorCodes.ROLE_NOT_FOUND, `Role with code ${code} not found`, 404);
    }

    res.json(successResponse(role, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/roles - Create new role
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code, description, permissions, level } = req.body;

    if (!name || !code) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Role name and code are required', 400);
    }

    // Check for duplicate code
    const existing = await rolesService.getRoleByCode(code);
    if (existing) {
      throw new ApiError(ErrorCodes.ROLE_ALREADY_EXISTS, `Role with code "${code}" already exists`, 409);
    }

    const role = await rolesService.createRole({
      name,
      code,
      description,
      permissions: permissions || [],
      level: level || 0,
    });

    res.status(201).json(successResponse(role, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/roles/:id - Update role
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existing = await rolesService.getRole(id);
    if (!existing) {
      throw new ApiError(ErrorCodes.ROLE_NOT_FOUND, `Role with id ${id} not found`, 404);
    }

    if (existing.isSystem) {
      throw new ApiError(ErrorCodes.FORBIDDEN, 'Cannot modify system roles', 403);
    }

    const updated = await rolesService.updateRole(id, updates);
    res.json(successResponse(updated, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/roles/:id - Delete role
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await rolesService.getRole(id);
    if (!existing) {
      throw new ApiError(ErrorCodes.ROLE_NOT_FOUND, `Role with id ${id} not found`, 404);
    }

    if (existing.isSystem) {
      throw new ApiError(ErrorCodes.FORBIDDEN, 'Cannot delete system roles', 403);
    }

    const deleted = await rolesService.deleteRole(id);
    res.json(successResponse({ deleted }, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

// ==================== User Routes ====================

/**
 * GET /api/v1/roles/users - List users
 */
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roleId, department, status, page = '1', pageSize = '20' } = req.query;

    const users = await rolesService.listUsers({
      roleId: roleId as string,
      department: department as string,
      status: status as string,
      page: parseInt(page as string, 10),
      pageSize: parseInt(pageSize as string, 10),
    });

    res.json(successResponse(users, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/roles/users/:id - Get user by ID
 */
router.get('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await rolesService.getUser(id);

    if (!user) {
      throw new ApiError(ErrorCodes.NOT_FOUND, `User with id ${id} not found`, 404);
    }

    // Get user permissions
    const permissions = await rolesService.getUserPermissions(id);
    
    res.json(successResponse({ ...user, permissions }, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/roles/users - Create new user
 */
router.post('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, displayName, department, title, roleIds, status } = req.body;

    if (!username || !email) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Username and email are required', 400);
    }

    // Check for duplicate username
    const existingUser = await rolesService.getUserByUsername(username);
    if (existingUser) {
      throw new ApiError(ErrorCodes.CONFLICT, `User with username "${username}" already exists`, 409);
    }

    const user = await rolesService.createUser({
      username,
      email,
      displayName,
      department,
      title,
      roleIds: roleIds || [],
      status: status || 'active',
    });

    res.status(201).json(successResponse(user, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/roles/users/:id - Update user
 */
router.put('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existing = await rolesService.getUser(id);
    if (!existing) {
      throw new ApiError(ErrorCodes.NOT_FOUND, `User with id ${id} not found`, 404);
    }

    const updated = await rolesService.updateUser(id, updates);
    res.json(successResponse(updated, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/roles/users/:id - Delete user
 */
router.delete('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await rolesService.getUser(id);
    if (!existing) {
      throw new ApiError(ErrorCodes.NOT_FOUND, `User with id ${id} not found`, 404);
    }

    const deleted = await rolesService.deleteUser(id);
    res.json(successResponse({ deleted }, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/roles/users/:id/roles - Assign role to user
 */
router.post('/users/:id/roles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;

    if (!roleId) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'roleId is required', 400);
    }

    const user = await rolesService.getUser(id);
    if (!user) {
      throw new ApiError(ErrorCodes.NOT_FOUND, `User with id ${id} not found`, 404);
    }

    const role = await rolesService.getRole(roleId);
    if (!role) {
      throw new ApiError(ErrorCodes.ROLE_NOT_FOUND, `Role with id ${roleId} not found`, 404);
    }

    const updated = await rolesService.assignRoleToUser(id, roleId);
    res.json(successResponse(updated, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/roles/users/:userId/roles/:roleId - Remove role from user
 */
router.delete('/users/:userId/roles/:roleId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, roleId } = req.params;

    const user = await rolesService.getUser(userId);
    if (!user) {
      throw new ApiError(ErrorCodes.NOT_FOUND, `User with id ${userId} not found`, 404);
    }

    const updated = await rolesService.removeRoleFromUser(userId, roleId);
    res.json(successResponse(updated, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/roles/users/:id/permissions - Get user permissions
 */
router.get('/users/:id/permissions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await rolesService.getUser(id);
    if (!user) {
      throw new ApiError(ErrorCodes.NOT_FOUND, `User with id ${id} not found`, 404);
    }

    const permissions = await rolesService.getUserPermissions(id);
    res.json(successResponse({ userId: id, permissions }, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/roles/initialize - Initialize default roles
 */
router.post('/initialize', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await rolesService.initializeRoles();
    res.json(successResponse({ initialized: true }, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

export { router as rolesRouter };
