import { KpiService, type KpiMetrics } from './service.js';

export interface SchedulerConfig {
  intervalMs: number;
  autoStart: boolean;
}

const DEFAULT_CONFIG: SchedulerConfig = {
  intervalMs: 5 * 60 * 1000, // 5 minutes
  autoStart: true,
};

export class KpiScheduler {
  private config: SchedulerConfig;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private lastCalculation: { timestamp: number; durationMs: number } | null = null;

  constructor(
    private kpiService: KpiService,
    config?: Partial<SchedulerConfig>,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (this.config.autoStart) {
      this.start();
    }
  }

  /** Start the scheduler */
  start(): void {
    if (this.intervalHandle !== null) {
      return; // Already running
    }
    
    // Run first calculation immediately
    this.calculate();
    
    // Schedule periodic calculations
    this.intervalHandle = setInterval(() => {
      this.calculate();
    }, this.config.intervalMs);
    
    // Allow the process to exit even if timer is active
    if (this.intervalHandle.unref) {
      this.intervalHandle.unref();
    }
    
    console.log(`[KpiScheduler] Started with interval: ${this.config.intervalMs}ms`);
  }

  /** Stop the scheduler */
  stop(): void {
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      console.log('[KpiScheduler] Stopped');
    }
  }

  /** Force an immediate calculation */
  async calculateNow(): Promise<KpiMetrics> {
    return this.calculate();
  }

  /** Check if scheduler is running */
  get isActive(): boolean {
    return this.intervalHandle !== null;
  }

  /** Get last calculation info */
  get lastRun(): { timestamp: number; durationMs: number } | null {
    return this.lastCalculation;
  }

  private async calculate(): Promise<KpiMetrics> {
    if (this.isRunning) {
      console.warn('[KpiScheduler] Calculation already in progress, skipping');
      return {} as KpiMetrics;
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      const metrics = await this.kpiService.calculateAllMetrics();
      const durationMs = Date.now() - startTime;
      
      this.lastCalculation = {
        timestamp: Date.now(),
        durationMs,
      };
      
      console.log(
        `[KpiScheduler] Calculation completed in ${durationMs}ms — ` +
        `riskScore: ${metrics.riskScore}, securityScore: ${metrics.securityScore}`
      );
      
      return metrics;
    } catch (error) {
      console.error('[KpiScheduler] Calculation failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }
}
