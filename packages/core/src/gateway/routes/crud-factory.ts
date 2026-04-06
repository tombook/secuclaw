/**
 * CRUD Factory - 通用数据访问工厂
 * 
 * 提供 getStore/saveStore 通用方法，减少 CRUD 路由中的重复代码
 */

import type { JsonStore } from '../../storage/json-store.js';

export interface RouterDeps {
  jsonStore: JsonStore;
  [key: string]: unknown;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CrudFactory {
  getStore: <T>(key: string) => Promise<T[]>;
  saveStore: <T>(key: string, data: T[]) => Promise<void>;
}

export function createCrudFactory(deps: RouterDeps): CrudFactory {
  return {
    async getStore<T>(key: string): Promise<T[]> {
      const data = await deps.jsonStore.get(key);
      return (data as T[]) || [];
    },

    async saveStore<T>(key: string, data: T[]): Promise<void> {
      await deps.jsonStore.set(key, data);
    },
  };
}

export function applyPagination<T>(
  items: T[],
  params: PaginationParams
): PaginationResult<T> {
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 20;
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder || 'desc';

  // Sort
  const sorted = [...items].sort((a: any, b: any) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return 0;
  });

  const total = sorted.length;
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  return {
    data: paginated,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export function filterByFields<T extends Record<string, any>>(
  items: T[],
  filters: Record<string, unknown>
): T[] {
  return items.filter((item) => {
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue;
      
      const itemValue = item[key];
      if (typeof value === 'string' && typeof itemValue === 'string') {
        if (!itemValue.toLowerCase().includes(value.toLowerCase())) {
          return false;
        }
      } else if (itemValue !== value) {
        return false;
      }
    }
    return true;
  });
}
