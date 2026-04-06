/**
 * Shared utility functions for SecuClaw
 */

/** Generate a unique ID with prefix */
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/** Paginate an array */
export function paginate<T>(items: T[], page = 1, pageSize = 20): { data: T[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } } {
  const total = items.length;
  return {
    data: items.slice((page - 1) * pageSize, page * pageSize),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

/** Sort an array by a single field */
export function sortByField<T>(items: T[], field: string, order: 'asc' | 'desc' = 'desc'): T[] {
  return [...items].sort((a: any, b: any) => {
    const aVal = a[field], bVal = b[field];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    }
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return 0;
  });
}

/** Sleep for ms milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Deep clone an object */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/** Safe JSON parse with fallback */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/** Format a timestamp to ISO string */
export function formatTimestamp(ts: number): string {
  return new Date(ts).toISOString();
}

/** Check if a value is a non-empty string */
export function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

/** Retry an async function with exponential backoff */
export async function retryAsync<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        await sleep(baseDelay * Math.pow(2, i));
      }
    }
  }
  throw lastError;
}
