const DEFAULT_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

class Counter {
  private values: Map<string, number> = new Map();
  constructor(
    public readonly name: string,
    public readonly help: string,
    public readonly labelNames: string[] = [],
  ) {}

  inc(value = 1, labels: Record<string, string> = {}): void {
    const key = this.makeKey(labels);
    this.values.set(key, (this.values.get(key) ?? 0) + value);
  }

  private makeKey(labels: Record<string, string>): string {
    return this.labelNames.map(n => labels[n] ?? '').join(',');
  }

  getValues(): Map<string, number> { return this.values; }
}

class Gauge {
  private values: Map<string, number> = new Map();
  constructor(
    public readonly name: string,
    public readonly help: string,
    public readonly labelNames: string[] = [],
  ) {}

  inc(value = 1, labels: Record<string, string> = {}): void {
    const key = this.makeKey(labels);
    this.values.set(key, (this.values.get(key) ?? 0) + value);
  }

  dec(value = 1, labels: Record<string, string> = {}): void {
    const key = this.makeKey(labels);
    this.values.set(key, (this.values.get(key) ?? 0) - value);
  }

  set(value: number, labels: Record<string, string> = {}): void {
    this.values.set(this.makeKey(labels), value);
  }

  private makeKey(labels: Record<string, string>): string {
    return this.labelNames.map(n => labels[n] ?? '').join(',');
  }

  getValues(): Map<string, number> { return this.values; }
}

class Histogram {
  private bucketCounts: Map<string, Map<string, number>> = new Map();
  private sums: Map<string, number> = new Map();
  private counts: Map<string, number> = new Map();
  constructor(
    public readonly name: string,
    public readonly help: string,
    public readonly buckets: number[] = DEFAULT_BUCKETS,
    public readonly labelNames: string[] = [],
  ) {
    this.buckets = [...buckets].sort((a, b) => a - b);
  }

  observe(value: number, labels: Record<string, string> = {}): void {
    const key = this.makeKey(labels);
    const bucketMap = this.bucketCounts.get(key) ?? new Map();
    for (const bound of this.buckets) {
      const bucketKey = String(bound);
      const current = bucketMap.get(bucketKey) ?? 0;
      bucketMap.set(bucketKey, current + (value <= bound ? 1 : 0));
    }
    this.bucketCounts.set(key, bucketMap);
    this.sums.set(key, (this.sums.get(key) ?? 0) + value);
    this.counts.set(key, (this.counts.get(key) ?? 0) + 1);
  }

  private makeKey(labels: Record<string, string>): string {
    return this.labelNames.map(n => labels[n] ?? '').join(',');
  }

  getBucketCounts(): Map<string, Map<string, number>> { return this.bucketCounts; }
  getSums(): Map<string, number> { return this.sums; }
  getCounts(): Map<string, number> { return this.counts; }
}

export class MetricsRegistry {
  private metrics: Map<string, Counter | Gauge | Histogram> = new Map();

  registerCounter(name: string, help: string, labelNames: string[] = []): Counter {
    const counter = new Counter(name, help, labelNames);
    this.metrics.set(name, counter);
    return counter;
  }

  registerGauge(name: string, help: string, labelNames: string[] = []): Gauge {
    const gauge = new Gauge(name, help, labelNames);
    this.metrics.set(name, gauge);
    return gauge;
  }

  registerHistogram(name: string, help: string, buckets: number[] = DEFAULT_BUCKETS, labelNames: string[] = []): Histogram {
    const histogram = new Histogram(name, help, buckets, labelNames);
    this.metrics.set(name, histogram);
    return histogram;
  }

  toString(): string {
    const lines: string[] = [];
    for (const metric of this.metrics.values()) {
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      const typeName = metric instanceof Counter ? 'counter' : metric instanceof Gauge ? 'gauge' : 'histogram';
      lines.push(`# TYPE ${metric.name} ${typeName}`);

      if (metric instanceof Histogram) {
        for (const [key, bucketMap] of metric.getBucketCounts()) {
          for (const [bound, count] of bucketMap) {
            lines.push(`${metric.name}_bucket{le="${bound}"} ${count}`);
          }
          lines.push(`${metric.name}_sum ${metric.getSums().get(key) ?? 0}`);
          lines.push(`${metric.name}_count ${metric.getCounts().get(key) ?? 0}`);
        }
      } else {
        for (const [key, value] of metric.getValues()) {
          lines.push(`${metric.name}${key ? `{${key}}` : ''} ${value}`);
        }
      }
    }
    return lines.join('\n');
  }
}

export function registerSystemMetrics(registry: MetricsRegistry): void {
  registry.registerCounter('http_requests_total', 'Total HTTP requests', ['method', 'path']);
  registry.registerHistogram('http_request_duration_seconds', 'HTTP request duration', undefined, ['method', 'path']);
  registry.registerGauge('ws_active_connections', 'Active WebSocket connections');
  registry.registerCounter('incidents_total', 'Total incidents processed', ['severity', 'category']);
  registry.registerCounter('vulnerabilities_total', 'Total vulnerabilities processed', ['severity', 'status']);
  registry.registerCounter('compliance_checks_total', 'Total compliance checks');
  registry.registerCounter('eventbus_events_total', 'Total EventBus events emitted', ['event_type']);
}

export const defaultRegistry = new MetricsRegistry();
