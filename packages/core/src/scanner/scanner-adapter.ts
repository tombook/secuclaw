export interface PortInfo {
  port: number;
  protocol: 'tcp' | 'udp';
  state: 'open' | 'closed' | 'filtered';
  service?: string;
  banner?: string;
}

export interface ServiceInfo {
  name: string;
  version: string;
  port: number;
}

export interface ScanTarget {
  host: string;
  ports: PortInfo[];
  os?: string;
  services?: ServiceInfo[];
}

export interface ScanResult {
  targets: ScanTarget[];
  scannedAt: number;
  duration: number;
}

export interface ScannerAdapter {
  scan(targets: string[]): Promise<ScanResult>;
}

const COMMON_PORTS = [
  { port: 22, service: 'ssh', banners: ['OpenSSH_8.9p1 Ubuntu-3', 'OpenSSH_9.0p1 Debian', 'OpenSSH_7.4p1 CentOS'] },
  { port: 80, service: 'http', banners: ['nginx/1.24.0', 'Apache/2.4.57', 'Caddy v2.7'] },
  { port: 443, service: 'https', banners: ['nginx/1.24.0', 'Apache/2.4.57', 'Cloudflare'] },
  { port: 3306, service: 'mysql', banners: ['MySQL 8.0.35', 'MariaDB 10.11.6'] },
  { port: 5432, service: 'postgresql', banners: ['PostgreSQL 15.4', 'PostgreSQL 16.0'] },
  { port: 8080, service: 'http-proxy', banners: ['Apache Tomcat/10.1', 'Jetty 12.0', 'WildFly 28'] },
  { port: 8443, service: 'https-alt', banners: ['Tomcat/10.1', 'Kubernetes Ingress', 'Istio Gateway'] },
];

const OS_OPTIONS = ['Linux 5.x', 'Windows Server 2022', 'FreeBSD 14', 'Ubuntu 22.04'];

export class PortScannerAdapter implements ScannerAdapter {
  constructor(private options?: { timeout?: number }) {}

  async scan(targets: string[]): Promise<ScanResult> {
    const scannedAt = Date.now();
    const delay = Math.min(this.options?.timeout ?? 3000, 1000 + Math.random() * 4000);
    await new Promise(resolve => setTimeout(resolve, delay));

    const scanTargets: ScanTarget[] = targets.map(host => {
      const ports: PortInfo[] = [];
      const services: ServiceInfo[] = [];
      for (const { port, service, banners } of COMMON_PORTS) {
        const roll = Math.random();
        let state: PortInfo['state'] = 'closed';
        let banner: string | undefined;
        if (roll < 0.3) {
          state = 'open';
          banner = banners[Math.floor(Math.random() * banners.length)];
          const version = banner.match(/[\d.]+/)?.[0] ?? '1.0';
          services.push({ name: service, version, port });
        } else if (roll < 0.5) {
          state = 'filtered';
        }
        ports.push({ port, protocol: 'tcp', state, service: state === 'open' ? service : undefined, banner });
      }
      const os = Math.random() > 0.2 ? OS_OPTIONS[Math.floor(Math.random() * OS_OPTIONS.length)] : undefined;
      return { host, ports, os, services: services.length > 0 ? services : undefined };
    });

    return { targets: scanTargets, scannedAt, duration: Date.now() - scannedAt };
  }
}
