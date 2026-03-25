/**
 * Vulnerabilities Routes
 * RESTful API for vulnerability management
 * DB-002: 漏洞库 API
 */

import { Router, Request, Response, NextFunction } from 'express';
import { JsonStore } from '../../storage/json-store.js';
import { ApiError, ErrorCodes, successResponse, PaginatedResponse } from '../types.js';

const router = Router();

// Initialize store
const jsonStore = new JsonStore('./data/storage');

// ==================== Types ====================

export interface Vulnerability {
  id: string;
  cveId: string;
  title: string;
  description: string;
  cvssScore?: number;
  cvssVector?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  cweIds: string[];
  affectedProducts: string[];
  status: 'OPEN' | 'IN_PROGRESS' | 'FIXED' | 'WONT_FIX' | 'RISK_ACCEPTED';
  priority?: string;
  exploitAvailable: boolean;
  exploitInWild: boolean;
  fixAvailable: boolean;
  fixVersion?: string;
  fixSteps?: string;
  aiPriority: number;
  businessImpact: number;
  exposureScore: number;
  threatScore: number;
  scanSource?: string;
  firstDetected: number;
  lastDetected: number;
  proofOfConcept?: string;
  assignedTo?: string;
  dueDate?: number;
  slaDeadline?: number;
  createdBy: string;
  createdAt: number;
  updatedBy: string;
  updatedAt: number;
}

export interface VulnerabilityAsset {
  id: string;
  vulnerabilityId: string;
  assetId: string;
  assetName: string;
  componentName?: string;
  componentVersion?: string;
  fixVersion?: string;
}

// ==================== Valid Enums ====================

const VulnSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const;
const VulnStatuses = ['OPEN', 'IN_PROGRESS', 'FIXED', 'WONT_FIX', 'RISK_ACCEPTED'] as const;

// ==================== Helpers ====================

async function getVulnerabilitiesStore() {
  const data = await jsonStore.get<Vulnerability[]>('vulnerabilities.json');
  return data || [];
}

async function saveVulnerabilitiesStore(data: Vulnerability[]) {
  await jsonStore.set('vulnerabilities.json', data);
}

async function getVulnAssetsStore() {
  const data = await jsonStore.get<VulnerabilityAsset[]>('vulnerability-assets.json');
  return data || [];
}

async function saveVulnAssetsStore(data: VulnerabilityAsset[]) {
  await jsonStore.set('vulnerability-assets.json', data);
}

// ==================== Routes ====================

/**
 * GET /api/v1/vulnerabilities - List vulnerabilities
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      severity,
      status,
      cveId,
      assignedTo,
      page = '1',
      pageSize = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    let vulns = await getVulnerabilitiesStore();

    // Filters
    if (severity) {
      vulns = vulns.filter(v => v.severity === severity);
    }
    if (status) {
      vulns = vulns.filter(v => v.status === status);
    }
    if (cveId) {
      vulns = vulns.filter(v => v.cveId.toLowerCase().includes((cveId as string).toLowerCase()));
    }
    if (assignedTo) {
      vulns = vulns.filter(v => v.assignedTo === assignedTo);
    }

    // Sort
    const sortKey = sortBy as keyof Vulnerability;
    vulns.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    const total = vulns.length;
    const totalPages = Math.ceil(total / pageSizeNum);
    const paginatedData = vulns.slice((pageNum - 1) * pageSizeNum, pageNum * pageSizeNum);

    const response: PaginatedResponse<Vulnerability> = {
      data: paginatedData,
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
 * GET /api/v1/vulnerabilities/enums - Get vulnerability enum values
 */
router.get('/enums', (req: Request, res: Response) => {
  res.json(successResponse({
    severities: VulnSeverities,
    statuses: VulnStatuses,
  }, (req as any).requestId));
});

/**
 * GET /api/v1/vulnerabilities/stats - Get vulnerability statistics
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vulns = await getVulnerabilitiesStore();

    const stats = {
      total: vulns.length,
      bySeverity: {
        CRITICAL: vulns.filter(v => v.severity === 'CRITICAL').length,
        HIGH: vulns.filter(v => v.severity === 'HIGH').length,
        MEDIUM: vulns.filter(v => v.severity === 'MEDIUM').length,
        LOW: vulns.filter(v => v.severity === 'LOW').length,
        INFO: vulns.filter(v => v.severity === 'INFO').length,
      },
      byStatus: {
        OPEN: vulns.filter(v => v.status === 'OPEN').length,
        IN_PROGRESS: vulns.filter(v => v.status === 'IN_PROGRESS').length,
        FIXED: vulns.filter(v => v.status === 'FIXED').length,
        WONT_FIX: vulns.filter(v => v.status === 'WONT_FIX').length,
        RISK_ACCEPTED: vulns.filter(v => v.status === 'RISK_ACCEPTED').length,
      },
      criticalExploitable: vulns.filter(v => v.severity === 'CRITICAL' && v.exploitInWild).length,
      avgCvssScore: (() => {
        let total = 0;
        for (const v of vulns) {
          total += v.cvssScore || 0;
        }
        return vulns.length > 0 ? total / vulns.length : 0;
      })(),
    };

    res.json(successResponse(stats, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/vulnerabilities/:id - Get vulnerability by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const vulns = await getVulnerabilitiesStore();
    const vuln = vulns.find(v => v.id === id);

    if (!vuln) {
      throw new ApiError(ErrorCodes.VULNERABILITY_NOT_FOUND, `Vulnerability with id ${id} not found`, 404);
    }

    // Get related assets
    const assets = await getVulnAssetsStore();
    const relatedAssets = assets.filter(a => a.vulnerabilityId === id);

    res.json(successResponse({ ...vuln, affectedAssets: relatedAssets }, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/vulnerabilities - Create new vulnerability
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data.cveId) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'CVE ID is required', 400);
    }
    if (!data.title) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Title is required', 400);
    }
    if (!data.severity) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Severity is required', 400);
    }

    // Validate enum values
    if (data.severity && !VulnSeverities.includes(data.severity as any)) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, `Invalid severity. Valid: ${VulnSeverities.join(', ')}`, 400);
    }
    if (data.status && !VulnStatuses.includes(data.status as any)) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, `Invalid status. Valid: ${VulnStatuses.join(', ')}`, 400);
    }

    // Check for duplicate CVE ID
    const vulns = await getVulnerabilitiesStore();
    const duplicate = vulns.find(v => v.cveId === data.cveId);
    if (duplicate) {
      throw new ApiError(ErrorCodes.VULNERABILITY_ALREADY_EXISTS, `Vulnerability with CVE ${data.cveId} already exists`, 409);
    }

    const now = Date.now();
    const vuln: Vulnerability = {
      id: `vuln_${now}_${Math.random().toString(36).substring(2, 11)}`,
      cveId: data.cveId,
      title: data.title,
      description: data.description || '',
      cvssScore: data.cvssScore,
      cvssVector: data.cvssVector,
      severity: data.severity,
      cweIds: data.cweIds || [],
      affectedProducts: data.affectedProducts || [],
      status: data.status || 'OPEN',
      priority: data.priority,
      exploitAvailable: data.exploitAvailable || false,
      exploitInWild: data.exploitInWild || false,
      fixAvailable: data.fixAvailable || false,
      fixVersion: data.fixVersion,
      fixSteps: data.fixSteps,
      aiPriority: data.aiPriority || 0,
      businessImpact: data.businessImpact || 0,
      exposureScore: data.exposureScore || 0,
      threatScore: data.threatScore || 0,
      scanSource: data.scanSource,
      firstDetected: now,
      lastDetected: now,
      proofOfConcept: data.proofOfConcept,
      assignedTo: data.assignedTo,
      dueDate: data.dueDate,
      slaDeadline: data.slaDeadline,
      createdBy: data.createdBy || 'system',
      createdAt: now,
      updatedBy: data.createdBy || 'system',
      updatedAt: now,
    };

    vulns.push(vuln);
    await saveVulnerabilitiesStore(vulns);

    // Add affected assets if provided
    if (data.affectedAssets && Array.isArray(data.affectedAssets)) {
      const assets = await getVulnAssetsStore();
      for (const asset of data.affectedAssets) {
        assets.push({
          id: `vuln-asset_${now}_${Math.random().toString(36).substring(2, 11)}`,
          vulnerabilityId: vuln.id,
          assetId: asset.assetId,
          assetName: asset.assetName,
          componentName: asset.componentName,
          componentVersion: asset.componentVersion,
          fixVersion: asset.fixVersion,
        });
      }
      await saveVulnAssetsStore(assets);
    }

    res.status(201).json(successResponse(vuln, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/vulnerabilities/:id - Update vulnerability
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const patches = req.body;

    const vulns = await getVulnerabilitiesStore();
    const index = vulns.findIndex(v => v.id === id);

    if (index === -1) {
      throw new ApiError(ErrorCodes.VULNERABILITY_NOT_FOUND, `Vulnerability with id ${id} not found`, 404);
    }

    // Validate enum values if provided
    if (patches.severity && !VulnSeverities.includes(patches.severity as any)) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, `Invalid severity`, 400);
    }
    if (patches.status && !VulnStatuses.includes(patches.status as any)) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, `Invalid status`, 400);
    }

    const updated: Vulnerability = {
      ...vulns[index],
      ...patches,
      id: vulns[index].id,
      cveId: patches.cveId || vulns[index].cveId,
      createdAt: vulns[index].createdAt,
      updatedAt: Date.now(),
    };

    vulns[index] = updated;
    await saveVulnerabilitiesStore(vulns);

    res.json(successResponse(updated, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/vulnerabilities/:id - Delete vulnerability
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    let vulns = await getVulnerabilitiesStore();
    const index = vulns.findIndex(v => v.id === id);

    if (index === -1) {
      throw new ApiError(ErrorCodes.VULNERABILITY_NOT_FOUND, `Vulnerability with id ${id} not found`, 404);
    }

    vulns = vulns.filter(v => v.id !== id);
    await saveVulnerabilitiesStore(vulns);

    // Also delete related assets
    let assets = await getVulnAssetsStore();
    assets = assets.filter(a => a.vulnerabilityId !== id);
    await saveVulnAssetsStore(assets);

    res.json(successResponse({ deleted: true, id }, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

export { router as vulnerabilitiesRouter };
