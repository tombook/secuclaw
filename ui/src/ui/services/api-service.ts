/**
 * API Service
 * RESTful API Service for SecuClaw Frontend
 */

const API_BASE = '/api/v1';

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
  requestId: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const result: ApiResponse<T> = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || `API Error: ${endpoint}`);
    }

    return result.data;
  }

  // ==================== Assets ====================
  async getAssets(params?: { page?: number; pageSize?: number }) {
    const query = params ? `?page=${params.page || 1}&pageSize=${params.pageSize || 20}` : '';
    return this.request<PaginatedResponse<any>>(`/assets${query}`);
  }

  async getAsset(id: string) {
    return this.request<any>(`/assets/${id}`);
  }

  async createAsset(data: any) {
    return this.request<any>('/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAsset(id: string, data: any) {
    return this.request<any>(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAsset(id: string) {
    return this.request<any>(`/assets/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Vulnerabilities ====================
  async getVulnerabilities(params?: { page?: number; pageSize?: number }) {
    const query = params ? `?page=${params.page || 1}&pageSize=${params.pageSize || 20}` : '';
    return this.request<PaginatedResponse<any>>(`/vulnerabilities${query}`);
  }

  async getVulnerability(id: string) {
    return this.request<any>(`/vulnerabilities/${id}`);
  }

  async createVulnerability(data: any) {
    return this.request<any>('/vulnerabilities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVulnerability(id: string, data: any) {
    return this.request<any>(`/vulnerabilities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVulnerability(id: string) {
    return this.request<any>(`/vulnerabilities/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Incidents ====================
  async getIncidents(params?: { page?: number; pageSize?: number }) {
    const query = params ? `?page=${params.page || 1}&pageSize=${params.pageSize || 20}` : '';
    return this.request<PaginatedResponse<any>>(`/incidents${query}`);
  }

  async getIncident(id: string) {
    return this.request<any>(`/incidents/${id}`);
  }

  async createIncident(data: any) {
    return this.request<any>('/incidents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateIncident(id: string, data: any) {
    return this.request<any>(`/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteIncident(id: string) {
    return this.request<any>(`/incidents/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Tasks ====================
  async getTasks(params?: { page?: number; pageSize?: number }) {
    const query = params ? `?page=${params.page || 1}&pageSize=${params.pageSize || 20}` : '';
    return this.request<PaginatedResponse<any>>(`/tasks${query}`);
  }

  async getTask(id: string) {
    return this.request<any>(`/tasks/${id}`);
  }

  async createTask(data: any) {
    return this.request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: any) {
    return this.request<any>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string) {
    return this.request<any>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Roles ====================
  async getRoles() {
    return this.request<any[]>('/roles');
  }

  async getRole(id: string) {
    return this.request<any>(`/roles/${id}`);
  }

  async createRole(data: any) {
    return this.request<any>('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRole(id: string, data: any) {
    return this.request<any>(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRole(id: string) {
    return this.request<any>(`/roles/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Users ====================
  async getUsers() {
    return this.request<any[]>('/roles/users');
  }

  async getUser(id: string) {
    return this.request<any>(`/roles/users/${id}`);
  }

  async createUser(data: any) {
    return this.request<any>('/roles/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: any) {
    return this.request<any>(`/roles/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request<any>(`/roles/users/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
export type { ApiResponse, PaginatedResponse };
