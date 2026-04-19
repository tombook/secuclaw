/**
 * Mock API Server — Vite 开发中间件
 * 拦截 /api/v1/* 请求，返回 manifest 中定义的 mock 数据
 * 
 * 使用方式：在 vite.config.ts 中注册为 plugin
 * 
 * ```ts
 * import { mockApiPlugin } from './src/plugins/adapters/mock-api-server';
 * export default defineConfig({ plugins: [mockApiPlugin()] });
 * ```
 */

import type { Plugin } from 'vite';
import { MOCK_RESPONSES } from '../mock-responses';
import type { StandardToolResult } from '../types';

// ─── Endpoint → MockFn 映射表 ───────────────────────

const ENDPOINT_MAP: Record<string, string> = {
  '/api/v1/alerts/queue': 'alert-queue',
  '/api/v1/soar/execute': 'soar-exec',
  '/api/v1/vuln/scan': 'vuln-scan',
  '/api/v1/threat-intel/search': 'threat-intel',
  '/api/v1/situation/global': 'global-situation',
  '/api/v1/risk/score': 'risk-score',
  '/api/v1/board/report': 'board-report',
  '/api/v1/compliance/check': 'compliance-chk',
  '/api/v1/threat/model': 'threat-model',
  '/api/v1/bcp/manage': 'bcp-mgmt',
  '/api/v1/sbom/scan': 'sbom-scan',
  // Third-party adapters
  '/api/v1/adapters/nessus/scan': 'nessus-scan',
  '/api/v1/adapters/splunk/search': 'splunk-query',
  '/api/v1/adapters/crowdstrike/detects': 'crowdstrike-detections',
  '/api/v1/adapters/virustotal/scan': 'virustotal-scan',
  '/api/v1/adapters/elastic/search': 'elastic-security',
  // New built-in tools
  '/api/v1/pen/test': 'pen-test',
  '/api/v1/gdpr/audit': 'gdpr-audit',
  '/api/v1/zero-trust/eval': 'zero-trust',
  '/api/v1/report/gen': 'report-gen',
  '/api/v1/ai/dispatch': 'ai-dispatch',
  '/api/v1/kpi/track': 'kpi-track',
  '/api/v1/incident/list': 'incident-mgmt',
  '/api/v1/log/analysis': 'log-analysis',
  '/api/v1/vendor/eval': 'vendor-eval',
  // ─── 新增工具 v3 ─────────────────────────
  '/api/v1/risk/register': 'risk-register',
  '/api/v1/budget/dash': 'budget-dash',
  '/api/v1/policy/mgmt': 'policy-mgmt',
  '/api/v1/data/map': 'data-map',
  '/api/v1/cost/calc': 'cost-calc',
  '/api/v1/patch/mgmt': 'patch-mgmt',
  '/api/v1/iam/config': 'iam-config',
  '/api/v1/cloud/security': 'cloud-security',
  '/api/v1/contract/review': 'contract-review',
  '/api/v1/thirdparty/risk': 'third-party-risk',
};

// ─── 延迟模拟 ────────────────────────────────────────

function randomDelay(min = 300, max = 1200): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min) + min);
  return new Promise(r => setTimeout(r, ms));
}

// ─── Vite Plugin ─────────────────────────────────────

export function mockApiPlugin(): Plugin {
  return {
    name: 'secuclaw-mock-api',
    enforce: 'pre',

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Health endpoint — always returns 200
        if (req.url === '/api/v1/health') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ok', mode: 'mock', timestamp: Date.now() }));
          return;
        }

        // Only intercept API paths
        if (!req.url?.startsWith('/api/v1/')) {
          return next();
        }

        const mockFn = ENDPOINT_MAP[req.url];
        if (!mockFn) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `未找到 mock: ${req.url}` }));
          return;
        }

        const generator = MOCK_RESPONSES[mockFn];
        if (!generator) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `Mock 函数不存在: ${mockFn}` }));
          return;
        }

        // Simulate network delay
        await randomDelay();

        try {
          const result: StandardToolResult = generator();

          // Wrap in standard API response envelope
          const envelope = {
            code: 0,
            message: 'success',
            data: result.rows,
            summary: result.summary,
            pagination: result.pagination,
            duration: result.duration,
          };

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('X-Mock-Server', 'secuclaw-mock');
          res.end(JSON.stringify(envelope));
        } catch (e) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `Mock 执行失败: ${e}` }));
        }
      });
    },
  };
}
