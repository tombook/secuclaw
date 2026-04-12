/**
 * Base Repository
 * 
 * Generic repository pattern for data storage using JsonStore
 */

import type { JsonStore } from '../storage/json-store.js';

export interface QueryParams {
  limit?: number;
  offset?: number;
}

export interface FilterQueryParams extends QueryParams {
  [key: string]: any;
}

/**
 * Generic repository base class providing CRUD operations
 */
export abstract class BaseRepository<T extends { id: string }> {
  protected fileName: string = '';
  
  constructor(protected store: JsonStore) {}
  
  /**
   * Get all items
   */
  async list(): Promise<T[]> {
    const items = await this.store.get<T[]>(this.fileName);
    return items || [];
  }
  
  /**
   * Get item by ID
   */
  async get(id: string): Promise<T | null> {
    const items = await this.list();
    return items.find(item => item.id === id) || null;
  }
  
  /**
   * Get items by filter
   */
  async getByFilter(filter: Partial<T>): Promise<T[]> {
    const items = await this.list();
    return items.filter(item => {
      return Object.entries(filter).every(([key, value]) => item[key as keyof T] === value);
    });
  }
  
  /**
   * Create new item
   */
  async create(item: T): Promise<T> {
    const items = await this.list();
    items.push(item);
    await this.store.set(this.fileName, items);
    return item;
  }
  
  /**
   * Update item
   */
  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const items = await this.list();
    const index = items.findIndex(item => item.id === id);
    
    if (index < 0) return null;
    
    items[index] = { ...items[index], ...updates };
    await this.store.set(this.fileName, items);
    return items[index];
  }
  
  /**
   * Delete item
   */
  async delete(id: string): Promise<boolean> {
    const items = await this.list();
    const filtered = items.filter(item => item.id !== id);
    
    if (filtered.length === items.length) return false;
    
    await this.store.set(this.fileName, filtered);
    return true;
  }
  
  /**
   * Save all items
   */
  async saveAll(items: T[]): Promise<void> {
    await this.store.set(this.fileName, items);
  }
  
  /**
   * Count items
   */
  async count(): Promise<number> {
    const items = await this.list();
    return items.length;
  }
  
  /**
   * Check if item exists
   */
  async exists(id: string): Promise<boolean> {
    const item = await this.get(id);
    return item !== null;
  }
}
