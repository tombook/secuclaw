/**
 * Incident Store
 * State management for security incidents
 */

import { BaseStore } from './base-store.js';
import { apiService } from '../services/api-service.js';

interface Incident {
  id: string;
  ticketId: string;
  info: {
    title: string;
    description: string;
    category: string;
    severity: string;
    priority: number;
  };
  timeline: {
    detectedAt?: number;
    reportedAt?: number;
    acknowledgedAt?: number;
    containingAt?: number;
    eradicatedAt?: number;
    recoveredAt?: number;
    closedAt?: number;
  };
  sla: {
    responseDeadline?: number;
    resolutionDeadline?: number;
    responseBreached: boolean;
    resolutionBreached: boolean;
  };
  workflow: {
    status: string;
    assignee?: string;
    previousStatus?: string;
  };
  impact: {
    affectedAssets: string[];
    affectedUsers: number;
    dataTypes: string[];
    businessImpact: string;
    estimatedLoss?: number;
  };
  attack?: {
    attackVector?: string;
    threatActor?: string;
    mitreTechniques?: string[];
    iocs?: string[];
  };
  handlers?: Array<{
    user: string;
    role: string;
    joinedAt?: number;
    actions: string[];
  }>;
  evidence?: {
    artifacts: string[];
    chainOfCustody: string[];
  };
  postMortem?: {
    rootCause: string;
    lessonsLearned: string[];
    recommendations: string[];
    completed: boolean;
  };
  createdAt?: number;
  updatedAt?: number;
}

interface IncidentState {
  incidents: Incident[];
  currentIncident: Incident | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

class IncidentStore extends BaseStore<IncidentState> {
  constructor() {
    super({
      incidents: [],
      currentIncident: null,
      loading: false,
      error: null,
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
      },
    });
  }

  async initialize(): Promise<void> {
    await this.loadIncidents();
  }

  async loadIncidents(page: number = 1, pageSize: number = 20): Promise<void> {
    this.setState({ loading: true, error: null });
    try {
      const result = await apiService.getIncidents({ page, pageSize });
      this.setState({
        incidents: result.data,
        loading: false,
        pagination: result.pagination,
      });
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Failed to load incidents',
        loading: false,
      });
    }
  }

  async loadIncident(id: string): Promise<void> {
    this.setState({ loading: true, error: null });
    try {
      const incident = await apiService.getIncident(id);
      this.setState({
        currentIncident: incident,
        loading: false,
      });
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Failed to load incident',
        loading: false,
      });
    }
  }

  async createIncident(data: Partial<Incident>): Promise<void> {
    this.setState({ loading: true, error: null });
    try {
      await apiService.createIncident(data);
      await this.loadIncidents();
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Failed to create incident',
        loading: false,
      });
    }
  }

  async updateIncident(id: string, data: Partial<Incident>): Promise<void> {
    this.setState({ loading: true, error: null });
    try {
      await apiService.updateIncident(id, data);
      await this.loadIncidents();
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Failed to update incident',
        loading: false,
      });
    }
  }

  async deleteIncident(id: string): Promise<void> {
    this.setState({ loading: true, error: null });
    try {
      await apiService.deleteIncident(id);
      await this.loadIncidents();
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Failed to delete incident',
        loading: false,
      });
    }
  }

  setCurrentIncident(incident: Incident | null): void {
    this.setState({ currentIncident: incident });
  }

  clearError(): void {
    this.setState({ error: null });
  }
}

export const incidentStore = new IncidentStore();
export type { Incident, IncidentState };
