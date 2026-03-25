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
      type: type as string,
      category: category as string,
      environment: environment as string,
      criticality: criticality as string,
      status: status as string,
      owner: owner as string,
      department: department as string,
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
    const asset = await assetsService.get(id);

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
    const asset = {
      id: `asset_${now}_${Math.random().toString(36).substring(2, 11)}`,
      name: assetData.name,
      type: assetData.type,
      category: assetData.category || 'other',
      environment: assetData.environment || 'production',
      criticality: assetData.criticality || 'medium',
      status: assetData.status || 'active',
      owner: assetData.owner,
      department: assetData.department,
      ip: assetData.ip,
      hostname: assetData.hostname,
      description: assetData.description,
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
    const updates = req.body;

    const existing = await assetsService.get(id);
    if (!existing) {
      throw new ApiError(ErrorCodes.ASSET_NOT_FOUND, `Asset with id ${id} not found`, 404);
    }

    // Update fields
    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // Prevent ID change
      createdAt: existing.createdAt, // Prevent creation time change
      updatedAt: Date.now(),
    };

    await assetsRepo.update(id, updated);

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
    const patches = req.body;

    const existing = await assetsService.get(id);
    if (!existing) {
      throw new ApiError(ErrorCodes.ASSET_NOT_FOUND, `Asset with id ${id} not found`, 404);
    }

    const updated = {
      ...existing,
      ...patches,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    };

    await assetsRepo.update(id, updated);

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

    const existing = await assetsService.get(id);
    if (!existing) {
      throw new ApiError(ErrorCodes.ASSET_NOT_FOUND, `Asset with id ${id} not found`, 404);
    }

    await assetsRepo.delete(id);

    res.json(successResponse({ deleted: true, id }, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

export { router as assetsRouter };
