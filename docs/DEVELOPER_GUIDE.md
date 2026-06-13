# SecuClaw Developer Guide v1.0.0

> **Complete guide** for developers contributing to SecuClaw or building integrations.

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Development Setup](#2-development-setup)
3. [Project Structure](#3-project-structure)
4. [Core Concepts](#4-core-concepts)
5. [Creating a New Module](#5-creating-a-new-module)
6. [Creating a New API Route](#6-creating-a-new-api-route)
7. [Creating a New UI Component](#7-creating-a-new-ui-component)
8. [Testing](#8-testing)
9. [Performance Optimization](#9-performance-optimization)
10. [Contributing Guidelines](#10-contributing-guidelines)

---

## 1. Architecture Overview

SecuClaw is built as a **monorepo** with two main packages:

```
secuclaw/
├── packages/
│   ├── core/          # Backend (Bun + TypeScript)
│   │   ├── src/       # 71 core modules
│   │   ├── data/      # Seed data (MITRE, SCF, default configs)
│   │   ├── prisma/    # Database schema
│   │   └── __tests__/ # Unit & E2E tests
│   └── ui/            # Frontend (Lit + TypeScript + Vite)
│       └── src/       # 37 web components
├── docker-compose.yml
├── Dockerfile
├── nginx/
└── .github/workflows/
```

### 1.1 Backend Stack
- **Runtime**: Bun 1.1.38 (Node.js compatible)
- **Language**: TypeScript 5.x (ESM modules, strict mode)
- **Storage**: JSON files with in-memory cache (CachedJsonStore)
- **Gateway**: Express 5 + WebSocket
- **DI**: typedi + reflect-metadata
- **Test**: vitest + bun test

### 1.2 Frontend Stack
- **Framework**: Lit 3.x (Web Components)
- **Build**: Vite 5
- **Styling**: Lit CSS-in-JS (no external CSS framework)
- **State**: Lit `@state` decorator (no Redux/MobX)

### 1.3 Key Patterns

**ESM with `.js` import suffix**:
```typescript
import { Foo } from './foo.js';  // Note: .js not .ts
```

**Inject via constructor (DI)**:
```typescript
@Injectable()
export class MyService {
  constructor(private store: JsonStore) {}
}
```

**Handler registration pattern**:
```typescript
handlers.set('module.method', async (params) => service.method(params));
```

**Stateless services with persistent storage**:
```typescript
constructor(private store: JsonStore) {}
async save() { await this.store.set('key.json', this.data); }
```

---

## 2. Development Setup

### 2.1 Prerequisites

- **Bun** 1.1.38+: `curl -fsSL https://bun.sh/install | bash`
- **Node.js** 20+ (optional, for compatibility testing)
- **Git** 2.30+
- **Docker** 20+ (for production testing)

### 2.2 Clone and Install

```bash
git clone https://github.com/secuclaw/secuclaw.git
cd secuclaw

# Install backend dependencies
cd packages/core
bun install

# Install frontend dependencies
cd ../ui
bun install
```

### 2.3 Run Development Servers

```bash
# Terminal 1: Backend (port 21981)
cd packages/core
bun run dev          # Auto-reload on file changes

# Terminal 2: Frontend (port 3200)
cd packages/ui
bun run dev          # Vite dev server with HMR

# Terminal 3: Watch logs
tail -f /tmp/secuclaw-backend.log
```

Visit `http://localhost:3200` for the UI.

### 2.4 IDE Setup

**VSCode** (`settings.json`):
```json
{
  "typescript.tsdk": "packages/core/node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  }
}
```

**Recommended Extensions**:
- TypeScript Language Server
- ESLint
- Bun for Visual Studio Code
- Lit Plugin

---

## 3. Project Structure

### 3.1 Backend (`packages/core/src/`)

```
src/
├── ai/                  # AI / LLM integration
│   ├── providers/       # OpenAI, Anthropic, Ollama, etc.
│   ├── llm-service.ts
│   └── insight-engine.ts
├── ai-scm/             # AI Supply Chain (MCP, Prompt)
├── ai-spm/             # AI Security Posture Management
├── api/                # REST API gateway
│   ├── routes/         # 797 handlers
│   └── server.ts
├── assets/             # Asset management
├── audit/              # Audit log + blockchain
├── auth/               # JWT, password, RBAC
├── billing/            # SaaS billing
├── capabilities/       # Task / capability engine
├── channels/           # Notification channels
├── commander/          # Role command system
├── compliance/         # Compliance frameworks
├── config/             # ConfigService
├── cspm/               # Cloud Security Posture
├── data/               # Data repositories
├── detection/          # Sigma rules
├── deployment/         # Multi-region deployment
├── di/                 # Dependency injection container
├── dspm/               # Data Security Posture
├── easm/               # External Attack Surface
├── events/             # Event bus
├── evolution/          # Self-evolution
├── gateway/            # WebSocket + API gateway
│   └── routes/         # 797 API handlers
├── incidents/          # Incident management
├── itdr/               # Identity Threat Detection
├── kpi/                # KPI tracking
├── multi-tenant/       # Tenant isolation
├── notification/       # Notification service
├── perf/               # Performance monitoring
├── privacy/            # Privacy (PET, GDPR, PIPL)
├── rasp/               # Runtime App Self-Protection
├── risk/               # Risk assessment
├── roles/              # Role-based access control
├── security/           # Core security
├── sigma/              # Sigma rule engine
├── skills/             # Skill marketplace
├── soar/               # Security Orchestration
├── storage/            # Storage layer (CachedJsonStore)
├── ueba/               # User Entity Behavior
└── warroom/            # War Room (incident response)
```

### 3.2 Frontend (`packages/ui/src/`)

```
src/
├── components/         # 37 web components
│   ├── itdr/           # ITDR dashboard
│   ├── saas/           # SaaS dashboard
│   ├── rasp/           # RASP dashboard
│   ├── dspm/           # DSPM dashboard
│   └── ...
├── pages/              # 3 public pages
│   ├── landing/        # Marketing page
│   ├── auth/           # Login/Signup
│   └── billing/        # Billing management
├── skills/             # SKILL definitions
└── index.ts            # Component exports
```

---

## 4. Core Concepts

### 4.1 CachedJsonStore

All persistent state is stored via `CachedJsonStore`:

```typescript
import { CachedJsonStore } from './storage/cached-json-store.js';

const store = new CachedJsonStore(basePath, {
  enabled: true,
  maxKeys: 1000,
  ttlMs: 300000
});

await store.set('users/alice.json', { id: '1', name: 'Alice' });
const user = await store.get('users/alice.json');
```

**Methods**:
- `set(key, value)` — Persist to disk + update cache
- `get<T>(key)` — Read from cache (or disk + cache)
- `delete(key)` — Remove
- `invalidate(key)` — Clear from cache
- `invalidateAll()` — Clear entire cache
- `getCacheStats()` — Hit rate, size, etc.

### 4.2 DI Container

```typescript
import { container, Injectable, Inject } from './di/container.js';

@Injectable()
export class MyService {
  constructor(@Inject('JsonStore') private store: JsonStore) {}
}

// Register
container.register('JsonStore', () => new CachedJsonStore(...));
container.register(MyService);

// Resolve
const service = container.resolve(MyService);
```

### 4.3 Event Bus

```typescript
import { EventBus } from './events/event-bus.js';

const bus = EventBus.getInstance();

// Emit
bus.emit('user.login', { userId: '1', timestamp: Date.now() });

// Subscribe
bus.on('user.login', (data) => {
  console.log('User logged in:', data);
});
```

### 4.4 Module Pattern

Every capability follows this pattern:

```typescript
import { CachedJsonStore } from '../storage/cached-json-store.js';

export interface Foo {
  id: string;
  name: string;
  // ...
}

export class FooService {
  private store: CachedJsonStore;
  private cache: Map<string, Foo> = new Map();

  constructor(store: CachedJsonStore) {
    this.store = store;
  }

  async list(filter?: FooFilter): Promise<Foo[]> {
    const all = (await this.store.get<Foo[]>('foos/index.json')) || [];
    return filter ? all.filter(f => /* match */) : all;
  }

  async get(id: string): Promise<Foo | null> {
    if (this.cache.has(id)) return this.cache.get(id)!;
    const foo = await this.store.get<Foo>(`foos/${id}.json`);
    if (foo) this.cache.set(id, foo);
    return foo;
  }

  async create(params: Omit<Foo, 'id' | 'createdAt'>): Promise<Foo> {
    const foo: Foo = {
      ...params,
      id: `foo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now()
    };
    const all = (await this.store.get<Foo[]>('foos/index.json')) || [];
    all.push(foo);
    await this.store.set('foos/index.json', all);
    return foo;
  }
}
```

---

## 5. Creating a New Module

### 5.1 Plan the Module

Before writing code, define:
- **Purpose**: What problem does it solve?
- **Data model**: TypeScript interfaces
- **API surface**: Public methods
- **Storage keys**: How to persist
- **UI integration**: Which dashboard?

### 5.2 Create the Service

`src/my-module/my-service.ts`:

```typescript
import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export interface MyEntity {
  id: string;
  name: string;
  createdAt: number;
}

const STORE_KEY = 'my-module/entities.json';

export class MyService {
  constructor(private store: JsonStore) {}

  async list(): Promise<MyEntity[]> {
    return (await this.store.get<MyEntity[]>(STORE_KEY)) || [];
  }

  async create(name: string): Promise<MyEntity> {
    const entity: MyEntity = {
      id: `ent_${randomUUID()}`,
      name,
      createdAt: Date.now()
    };
    const all = await this.list();
    all.push(entity);
    await this.store.set(STORE_KEY, all);
    return entity;
  }
}
```

### 5.3 Register in DI Container

`src/di/container.ts`:

```typescript
import { MyService } from '../my-module/my-service.js';

container.register(MyService, () => new MyService(jsonStore));
```

### 5.4 Expose via API Routes

`src/gateway/routes/my-routes.ts`:

```typescript
import type { RouterDeps } from '../router.js';
import { MyService } from '../../my-module/my-service.js';

export function registerMyRoutes(handlers: Map<string, Function>, deps: RouterDeps): void {
  const service = new MyService((deps as any).jsonStore);
  handlers.set('mymodule.list', async () => service.list());
  handlers.set('mymodule.create', async (p: any) => service.create(p.name));
}
```

Then in `src/gateway/routes/index.ts`:

```typescript
export { registerMyRoutes } from './my-routes.js';
```

And in `src/main.ts`:

```typescript
import { registerMyRoutes } from './gateway/routes/my-routes.js';

// In the routes registration section:
registerMyRoutes(handlersMap, deps);
```

### 5.5 Add to UI

`ui/src/components/my-module/sc-my-dashboard.ts`:

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-my-dashboard')
export class ScMyDashboard extends LitElement {
  static styles = css`
    :host { display: block; padding: 16px; }
  `;

  @state() private _entities: any[] = [];
  @state() private _loading = false;

  connectedCallback() {
    super.connectedCallback();
    this._load();
  }

  private async _load() {
    this._loading = true;
    const r = await fetch('http://127.0.0.1:21981/api/v1/mymodule.list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params: {} })
    });
    this._entities = (await r.json()) || [];
    this._loading = false;
  }

  render() {
    return html`
      <h2>My Module</h2>
      ${this._loading ? html`<p>Loading...</p>` : html`
        <ul>
          ${this._entities.map(e => html`<li>${e.name}</li>`)}
        </ul>
      `}
    `;
  }
}
```

Register in `ui/src/components/index.ts`:

```typescript
export { ScMyDashboard } from './my-module/sc-my-dashboard.js';
```

---

## 6. Creating a New API Route

### 6.1 Naming Convention

- Format: `domain.action`
- Examples: `itdr.credential.stats`, `saas.billing.plans.list`

### 6.2 Handler Signature

```typescript
handlers.set('domain.action', async (params: any) => {
  // params is the full request body
  return result;
});
```

### 6.3 Error Handling

```typescript
handlers.set('mymodule.risky-operation', async (params: any) => {
  try {
    const result = await service.doSomething(params);
    return result;
  } catch (e: any) {
    throw new Error(`Operation failed: ${e.message}`);
  }
});
```

### 6.4 Async Initialization

```typescript
export function registerMyRoutes(handlers: Map<string, Function>, deps: RouterDeps): void {
  const service = new MyService((deps as any).jsonStore);

  handlers.set('mymodule.init', async () => {
    await service.initialize();
    return { status: 'initialized' };
  });

  // ... more handlers
}
```

---

## 7. Creating a New UI Component

### 7.1 Component Template

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

@customElement('sc-my-component')
export class ScMyComponent extends LitElement {
  static styles = css`
    :host {
      display: block;
      --sc-bg: #0a0f1a;
      --sc-text: #f9fafb;
      background: var(--sc-bg);
      color: var(--sc-text);
      padding: 16px;
    }
  `;

  @property() apiBase = 'http://127.0.0.1:21981/api/v1';
  @state() private _data: any = null;
  @state() private _loading = false;

  private async _apiCall(handler: string, params: any = {}): Promise<any> {
    try {
      const r = await fetch(`${this.apiBase}/${handler}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params })
      });
      return r.ok ? await r.json() : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this._load();
  }

  private async _load() {
    this._loading = true;
    this._data = await this._apiCall('mymodule.list');
    this._loading = false;
  }

  render() {
    if (this._loading) return html`<div>Loading...</div>`;
    if (!this._data) return html`<div>No data</div>`;
    return html`<div>${JSON.stringify(this._data)}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-my-component': ScMyComponent;
  }
}
```

### 7.2 CSS Variables (Design Tokens)

Always use these CSS variables for consistency:

```css
--sc-bg-primary: #0a0f1a;
--sc-bg-secondary: #111827;
--sc-bg-tertiary: #1f2937;
--sc-text-primary: #f9fafb;
--sc-text-muted: #6b7280;
--sc-text-secondary: #9ca3af;
--sc-border: #374151;
--sc-primary: #00d4ff;
--sc-critical: #ef4444;
--sc-high: #f59e0b;
--sc-medium: #3b82f6;
--sc-low: #22c55e;
--sc-info: #0ea5e9;
```

---

## 8. Testing

### 8.1 Unit Tests

`packages/core/__tests__/unit/my-module.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { MyService } from '../../src/my-module/my-service.js';
import { CachedJsonStore } from '../../src/storage/cached-json-store.js';

describe('MyService', () => {
  it('should create entity', async () => {
    const store = new CachedJsonStore('./data/test', { enabled: false });
    const service = new MyService(store);
    const entity = await service.create('Test');
    expect(entity.name).toBe('Test');
    expect(entity.id).toMatch(/^ent_/);
  });
});
```

Run: `cd packages/core && bun test`

### 8.2 E2E Tests

`packages/core/__tests__/e2e-modules.test.ts`:

See existing test file for the pattern. Run with: `bun test __tests__/e2e-modules.test.ts`

### 8.3 Performance Tests

`packages/core/__tests__/perf-benchmark.test.ts`:

Measure throughput with ops/sec metrics.

---

## 9. Performance Optimization

### 9.1 Use CachedJsonStore

Always use `CachedJsonStore` (not raw `JsonStore`) for hot paths.

### 9.2 Batch Operations

```typescript
async batchCreate(items: Item[]): Promise<Item[]> {
  const all = await this.list();
  const newItems = items.map(/* map */);
  all.push(...newItems);
  await this.store.set('items.json', all);  // Single write
  return newItems;
}
```

### 9.3 In-Memory Index

```typescript
class FooService {
  private index: Map<string, Foo> = new Map();

  async list(): Promise<Foo[]> {
    if (this.index.size === 0) {
      const all = await this.store.get('foos.json') || [];
      this.index = new Map(all.map(f => [f.id, f]));
    }
    return Array.from(this.index.values());
  }
}
```

### 9.4 Profile Before Optimizing

```bash
# CPU profiling
bun --prof run src/main.ts

# Memory
console.log(process.memoryUsage());
```

---

## 10. Contributing Guidelines

### 10.1 Code Style

- **TypeScript strict mode** enabled
- **No `any` in public APIs** (use `unknown` + type guards)
- **ESM modules with `.js` import suffix**
- **No code comments** (per project convention)
- **2-space indentation**
- **Single quotes** for strings

### 10.2 Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(billing): add Stripe webhook integration
fix(itdr): handle null device fingerprint
docs(api): add saas.billing endpoint reference
test(e2e): add RASP integration tests
```

### 10.3 Pull Request Process

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make changes + add tests
4. Run tests: `bun test`
5. Run linter: `bun run lint`
6. Run type check: `bun run tsc --noEmit`
7. Commit + push
8. Open PR with description

### 10.4 Testing Checklist

- [ ] Unit tests pass (`bun test`)
- [ ] E2E tests pass (`bun test __tests__/e2e-modules.test.ts`)
- [ ] No new TypeScript errors
- [ ] Linter clean
- [ ] Documentation updated
- [ ] Performance impact measured

### 10.5 Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v1.x.y`
4. Push: `git push origin v1.x.y`
5. CI/CD builds Docker image + publishes to GHCR
6. Auto-deploys to staging (on develop) / production (on tags)

## Resources

- **API Reference**: [/docs/API_REFERENCE.md](API_REFERENCE.md)
- **User Guide**: [/docs/USER_GUIDE.md](USER_GUIDE.md)
- **GitHub**: https://github.com/secuclaw/secuclaw
- **Discord**: https://discord.gg/secuclaw
- **Office Hours**: Every Friday 4pm UTC (for maintainers)
