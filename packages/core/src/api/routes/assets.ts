/**
 * Assets Routes
 * RESTful API for asset management
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AssetsService } from '../../assets/service.js';
import { AssetsRepository } from '../../assets/repository.js';
import { JsonStore } from '../../storage/json-store.js';
import { ApiError, ErrorCodes, successResponse, errorResponse, PaginatedResponse } from '../types.js';

const router = Router();

// Initialize service
const jsonStore = new JsonStore('./data/storage');
const assetsRepo = new AssetsRepository(jsonStore);
const assetsService = new AssetsService(assetsRepo);

// Asset types enum
const AssetTypes = ['server', 'workstation', 'network', 'database', 'application', 'cloud', 'container', 'iot', 'mobile', 'other'] as const;
const AssetCategories = ['infrastructure', 'endpoint', 'network', 'application', 'data', 'cloud-resource', 'container', 'mobile-device'] as const;
const AssetEnvironments = ['production', 'staging', 'development', 'test'] as const;
const AssetCriticalities = ['critical', 'high', 'medium', 'low'] as const;
const AssetStatuses = ['active', 'inactive', 'maintenance', 'decommissioned', 'pending'] as const;

/**
 * GET /api/v1/assets - List assets with filters
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      type,
      category,
      environment,
      criticality,
      status,
      owner,
      department,
      page = '1',
      pageSize = '20',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);

    const assets = await assetsService.list({
      type: type as unknown as AssetType,
      category: category as unknown as string,
      environment: environment as unknown as AssetEnvironment,
      criticality: criticality as unknown as AssetCriticality,
      status: status as unknown as AssetStatus,
      owner: owner as unknown as string,
      department: department as unknown as string,
      page: pageNum,
      pageSize: pageSizeNum,
    });

    const allAssets = await assetsService.list({});
    const total = allAssets.length;
    const totalPages = Math.ceil(total / pageSizeNum);

    const response: PaginatedResponse<typeof assets[0]> = {
      data: assets,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages,
      },
    };

    res.json(successResponse(response, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/assets/stats - Get asset statistics
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await assetsService.getStats();
    res.json(successResponse(stats, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/assets/enums - Get asset enum values
 */
router.get('/enums', (req: Request, res: Response) => {
  res.json(successResponse({
    types: AssetTypes,
    categories: AssetCategories,
    environments: AssetEnvironments,
    criticalities: AssetCriticalities,
    statuses: AssetStatuses,
  }, (req as any).requestId));
});

/**
 * GET /api/v1/assets/:id - Get asset by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const assetId = Array.isArray(id) ? id[0] : id;
    const asset = await assetsService.get(assetId);

    if (!asset) {
      throw new ApiError(ErrorCodes.ASSET_NOT_FOUND, `Asset with id ${id} not found`, 404);
    }

    res.json(successResponse(asset, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/assets - Create new asset
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assetData = req.body;

    // Validate required fields
    if (!assetData.name) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Asset name is required', 400);
    }
    if (!assetData.type) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Asset type is required', 400);
    }

    // Validate type
    if (assetData.type && !AssetTypes.includes(assetData.type as any)) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, `Invalid asset type. Valid types: ${AssetTypes.join(', ')}`, 400);
    }

    // Check for duplicate name
    const existingAssets = await assetsService.list({});
    const duplicate = existingAssets.find(a => a.name === assetData.name);
    if (duplicate) {
      throw new ApiError(ErrorCodes.ASSET_ALREADY_EXISTS, `Asset with name "${assetData.name}" already exists`, 409);
    }

    // Set defaults
    const now = Date.now();
    // Convert query params that could be string[] to string
    const name = Array.isArray(assetData.name) ? assetData.name[0] : assetData.name;
    const type = Array.isArray(assetData.type) ? assetData.type[0] : assetData.type;
    const category = Array.isArray(assetData.category) ? assetData.category[0] : (assetData.category || 'other');
    const environment = Array.isArray(assetData.environment) ? assetData.environment[0] : (assetData.environment || 'production');
    const criticality = Array.isArray(assetData.criticality) ? assetData.criticality[0] : (assetData.criticality || 'medium');
    const status = Array.isArray(assetData.status) ? assetData.status[0] : (assetData.status || 'active');
    const owner = Array.isArray(assetData.owner) ? assetData.owner[0] : assetData.owner;
    const department = Array.isArray(assetData.department) ? assetData.department[0] : assetData.department;
    const ip = Array.isArray(assetData.ip) ? assetData.ip[0] : assetData.ip;
    const hostname = Array.isArray(assetData.hostname) ? assetData.hostname[0] : assetData.hostname;
    const description = Array.isArray(assetData.description) ? assetData.description[0] : assetData.description;
    
    const asset: SecurityAsset = {
      id: `asset_${now}_${Math.random().toString(36).substring(2, 11)}`,
      name,
      type: type as AssetType,
      category,
      environment: environment as AssetEnvironment,
      criticality: criticality as AssetCriticality,
      status: status as AssetStatus,
      owner,
      department,
      ip,
      hostname,
      description,
      tags: assetData.tags || [],
      vulnerabilities: [],
      lastScan: undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Save to repository
    await assetsRepo.create(asset);

    res.status(201).json(successResponse(asset, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/assets/:id - Update asset
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const assetId = Array.isArray(id) ? id[0] : id;
    const updates = req.body;

    // Handle possible array values from bad request
    const processedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      acc[key] = Array.isArray(value) ? value[0] : value;
      return acc;
    }, {} as Record<string, any>);

    const existing = await assetsService.get(assetId);
    if (!existing) {
      throw new ApiError(ErrorCodes.ASSET_NOT_FOUND, `Asset with id ${id} not found`, 404);
    }

    // Update fields
    const updated = {
      ...existing,
      ...processedUpdates,
      id: existing.id, // Prevent ID change
      createdAt: existing.createdAt, // Prevent creation time change
      updatedAt: Date.now(),
    };
    
    // Fix types for enum fields
    if ('type' in processedUpdates && updated.type) {
      updated.type = processedUpdates.type as AssetType;
    }
    if ('environment' in processedUpdates && updated.environment) {
      updated.environment = processedUpdates.environment as AssetEnvironment;
    }
    if ('criticality' in processedUpdates && updated.criticality) {
      updated.criticality = processedUpdates.criticality as AssetCriticality;
    }
    if ('status' in processedUpdates && updated.status) {
      updated.status = processedUpdates.status as AssetStatus;
    }

    await assetsRepo.update(assetId, updated);

    res.json(successResponse(updated, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/assets/:id - Partial update asset
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const assetId = Array.isArray(id) ? id[0] : id;
    const patches = req.body;

    // Handle possible array values
    const processedPatches = Object.entries(patches).reduce((acc, [key, value]) => {
      acc[key] = Array.isArray(value) ? value[0] : value;
      return acc;
    }, {} as Record<string, any>);

    const existing = await assetsService.get(assetId);
    if (!existing) {
      throw new ApiError(ErrorCodes.ASSET_NOT_FOUND, `Asset with id ${assetId} not found`, 404);
    }

    const updated = {
      ...existing,
      ...processedPatches,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    };
    
    // Fix types for enum fields
    if ('type' in processedPatches && updated.type) {
      updated.type = processedPatches.type as AssetType;
    }
    if ('environment' in processedPatches && updated.environment) {
      updated.environment = processedPatches.environment as AssetEnvironment;
    }
    if ('criticality' in processedPatches && updated.criticality) {
      updated.criticality = processedPatches.criticality as AssetCriticality;
    }
    if ('status' in processedPatches && updated.status) {
      updated.status = processedPatches.status as AssetStatus;
    }

    await assetsRepo.update(assetId, updated);

    res.json(successResponse(updated, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/assets/:id - Delete asset
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const assetId = Array.isArray(id) ? id[0] : id;

    const existing = await assetsService.get(assetId);
    if (!existing) {
      throw new ApiError(ErrorCodes.ASSET_NOT_FOUND, `Asset with id ${id} not found`, 404);
    }

    await assetsRepo.delete(assetId);

    res.json(successResponse({ deleted: true, id: assetId }, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

export { router as assetsRouter };
