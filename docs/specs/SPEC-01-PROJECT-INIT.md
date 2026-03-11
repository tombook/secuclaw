# SPEC-01: Project Initialization

> **Document Version**: 1.0  
> **Created**: 2026-03-08  
> **Purpose**: AI-Implementation-Ready Specification for SecuClaw Project Initialization

---

## 1. Project Structure

### 1.1 Complete Directory Tree

```
secuclaw/
├── package.json                    # Root monorepo configuration
├── pnpm-workspace.yaml             # PNPM workspace definition
├── tsconfig.json                   # Root TypeScript config
├── .gitignore                      # Git ignore patterns
├── .env.example                    # Environment variables template
├── README.md                       # Project documentation
│
├── ui/                             # Frontend package
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.ts                 # Entry point
│       ├── i18n/
│       │   ├── index.ts
│       │   ├── lib/
│       │   │   ├── translate.ts
│       │   │   ├── types.ts
│       │   │   ├── registry.ts
│       │   │   └── lit-controller.ts
│       │   └── locales/
│       │       ├── zh-CN.ts
│       │       ├── en.ts
│       │       └── zh-TW.ts
│       ├── ui/
│       │   ├── app.ts
│       │   ├── router.ts
│       │   ├── gateway-client.ts
│       │   ├── layout/
│       │   │   ├── sc-layout.ts
│       │   │   ├── sc-sidebar.ts
│       │   │   └── sc-header.ts
│       │   ├── pages/
│       │   │   ├── sc-dashboard.ts
│       │   │   ├── sc-threats-page.ts
│       │   │   ├── sc-threat-detail.ts
│       │   │   ├── sc-incidents-page.ts
│       │   │   ├── sc-vulnerabilities-page.ts
│       │   │   ├── sc-compliance-page.ts
│       │   │   ├── sc-reports-page.ts
│       │   │   ├── sc-risk-page.ts
│       │   │   ├── sc-war-room-page.ts
│       │   │   ├── sc-ai-experts-page.ts
│       │   │   ├── sc-knowledge-base.ts
│       │   │   ├── sc-skills-market.ts
│       │   │   ├── sc-channels-page.ts
│       │   │   └── settings/
│       │   │       ├── sc-settings-page.ts
│       │   │       ├── sc-llm-service-config.ts
│       │   │       └── sc-ai-experts-config.ts
│       │   ├── components/
│       │   │   ├── sc-role-card.ts
│       │   │   ├── sc-skill-panel.ts
│       │   │   ├── sc-mitre-heatmap.ts
│       │   │   ├── sc-scf-dashboard.ts
│       │   │   └── sc-channel-card.ts
│       │   └── store/
│       │       ├── commander-store.ts
│       │       ├── skill-store.ts
│       │       └── ui-store.ts
│       └── styles/
│           ├── main.css
│           └── themes/
│               ├── light.css
│               └── dark.css
│
├── packages/
│   └── core/                       # Backend package
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── main.ts             # Entry point
│           ├── gateway/
│           │   ├── server.ts
│           │   ├── router.ts
│           │   └── middleware/
│           │       ├── auth.ts
│           │       └── validation.ts
│           ├── commander/
│           │   ├── manager.ts
│           │   ├── store.ts
│           │   └── types.ts
│           ├── skills/
│           │   ├── loader.ts
│           │   ├── parser.ts
│           │   ├── manager.ts
│           │   └── market-service.ts
│           ├── knowledge/
│           │   ├── mitre/
│           │   │   ├── loader.ts
│           │   │   ├── search.ts
│           │   │   └── types.ts
│           │   └── scf/
│           │       ├── loader.ts
│           │       ├── search.ts
│           │       └── types.ts
│           ├── channels/
│           │   ├── manager.ts
│           │   ├── feishu.ts
│           │   ├── telegram.ts
│           │   ├── slack.ts
│           │   ├── discord.ts
│           │   ├── whatsapp.ts
│           │   ├── google-chat.ts
│           │   ├── teams.ts
│           │   ├── signal.ts
│           │   ├── imessage.ts
│           │   └── nostr.ts
│           ├── llm/
│           │   ├── provider-manager.ts
│           │   ├── openai.ts
│           │   ├── anthropic.ts
│           │   ├── azure.ts
│           │   └── local.ts
│           └── storage/
│               ├── json-store.ts
│               └── sqlite-store.ts
│
├── docs/                           # Documentation
│   ├── ARCHITECTURE.md
│   ├── WEB_TRANSFORMATION_PLAN.md
│   └── specs/
│       ├── SPEC-01-PROJECT-INIT.md
│       ├── SPEC-02-FRONTEND-ARCH.md
│       ├── SPEC-03-BACKEND-ARCH.md
│       └── ...
│
├── data/                           # Knowledge base data
│   ├── mitre/
│   │   └── attack-stix-data/
│   │       ├── enterprise-attack.json
│   │       ├── mobile-attack.json
│   │       └── ics-attack.json
│   └── scf/
│       ├── scf-data.json
│       ├── scf-20254.json
│       └── ...
│
├── skills/                         # Security role definitions
│   ├── security-expert/
│   │   ├── SKILL.md
│   │   └── SKILL.en-US.md
│   ├── privacy-officer/
│   ├── security-architect/
│   ├── business-security-officer/
│   ├── secuclaw-commander/
│   ├── ciso/
│   ├── security-ops/
│   └── supply-chain-security/
│
└── config/                         # Configuration files
    ├── default.json
    └── logging.json
```

---

## 2. Root Configuration Files

### 2.1 package.json (root)

```json
{
  "name": "secuclaw",
  "version": "1.0.0",
  "description": "SecuClaw Security Commander System - AI-powered security decision platform with 8 security roles",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "concurrently \"pnpm run dev:ui\" \"pnpm run dev:core\"",
    "dev:ui": "pnpm --filter ui dev",
    "dev:core": "pnpm --filter @secuclaw/core dev",
    "build": "pnpm run build:core && pnpm run build:ui",
    "build:ui": "pnpm --filter ui build",
    "build:core": "pnpm --filter @secuclaw/core build",
    "start": "pnpm --filter @secuclaw/core start",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "clean": "pnpm -r clean && rm -rf node_modules"
  },
  "keywords": [
    "security",
    "commander",
    "mitre-attack",
    "scf",
    "ai",
    "llm"
  ],
  "author": "SecuClaw Team",
  "license": "MIT",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "typescript": "^5.3.3"
  }
}
```

### 2.2 pnpm-workspace.yaml

```yaml
packages:
  - 'ui'
  - 'packages/*'
```

### 2.3 tsconfig.json (root)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "paths": {
      "@secuclaw/core": ["./packages/core/src"],
      "@secuclaw/ui": ["./ui/src"]
    },
    "baseUrl": "."
  },
  "references": [
    { "path": "./ui" },
    { "path": "./packages/core" }
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/dist/**"
  ]
}
```

### 2.4 .gitignore

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment files
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
pnpm-debug.log*

# Test coverage
coverage/

# Temporary files
tmp/
temp/
*.tmp

# Data files (optional - uncomment if you don't want to track data)
# data/mitre/attack-stix-data/*.json
# data/scf/*.json

# SQLite databases
*.db
*.sqlite
*.sqlite3

# Config with secrets
config/secrets.json
```

---

## 3. Frontend Package (ui/)

### 3.1 ui/package.json

```json
{
  "name": "ui",
  "version": "1.0.0",
  "description": "SecuClaw Frontend - Lit Web Components UI",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.js",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "lit": "^3.1.2",
    "@lit/reactive-element": "^2.0.4",
    "lit-element": "^4.0.4",
    "lit-html": "^3.1.2",
    "@vaadin/router": "^1.7.5"
  },
  "devDependencies": {
    "@types/node": "^20.11.5",
    "typescript": "^5.3.3",
    "vite": "^5.0.12",
    "@open-wc/dev-server-hmr": "^0.1.2",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.19.1",
    "@typescript-eslint/parser": "^6.19.1"
  }
}
```

### 3.2 ui/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/ui/components/*"],
      "@pages/*": ["src/ui/pages/*"],
      "@store/*": ["src/ui/store/*"],
      "@i18n/*": ["src/i18n/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.js"],
  "exclude": ["node_modules", "dist"]
}
```

### 3.3 ui/vite.config.ts

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/ui/components'),
      '@pages': resolve(__dirname, 'src/ui/pages'),
      '@store': resolve(__dirname, 'src/ui/store'),
      '@i18n': resolve(__dirname, 'src/i18n'),
    },
  },

  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:21981',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:21981',
        ws: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          lit: ['lit', '@lit/reactive-element', 'lit-html'],
          router: ['@vaadin/router'],
        },
      },
    },
  },

  optimizeDeps: {
    include: ['lit', '@lit/reactive-element', '@vaadin/router'],
  },

  plugins: [
    // HMR for Lit components
    {
      name: 'lit-hmr',
      handleHotUpdate({ file, server }) {
        if (file.endsWith('.ts') || file.endsWith('.js')) {
          server.ws.send({
            type: 'full-reload',
            path: '*',
          });
        }
      },
    },
  ],
});
```

### 3.4 ui/index.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="SecuClaw Security Commander System">
  <meta name="theme-color" content="#1a1a2e">
  
  <title>SecuClaw - Security Commander</title>
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  
  <!-- Preload critical fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  
  <!-- Theme initialization (prevent flash) -->
  <script>
    (function() {
      const theme = localStorage.getItem('secuclaw-theme') || 'dark';
      document.documentElement.setAttribute('data-theme', theme);
    })();
  </script>
  
  <!-- Main styles -->
  <link rel="stylesheet" href="/src/styles/main.css">
</head>
<body>
  <!-- Root application element -->
  <sc-app id="app"></sc-app>
  
  <!-- Main entry point -->
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

---

## 4. Backend Package (packages/core/)

### 4.1 packages/core/package.json

```json
{
  "name": "@secuclaw/core",
  "version": "1.0.0",
  "description": "SecuClaw Core Backend - WebSocket Gateway and Services",
  "type": "module",
  "main": "dist/main.js",
  "types": "dist/main.d.ts",
  "scripts": {
    "dev": "bun --watch src/main.ts",
    "build": "bun build src/main.ts --outdir dist --target bun",
    "start": "bun src/main.ts",
    "test": "bun test",
    "lint": "eslint src --ext .ts",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "ws": "^8.16.0",
    "better-sqlite3": "^9.4.0",
    "gray-matter": "^4.0.3",
    "yaml": "^2.3.4"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@types/ws": "^8.5.10",
    "@types/better-sqlite3": "^7.6.8",
    "typescript": "^5.3.3",
    "eslint": "^8.56.0"
  }
}
```

### 4.2 packages/core/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@gateway/*": ["src/gateway/*"],
      "@services/*": ["src/services/*"],
      "@knowledge/*": ["src/knowledge/*"],
      "@storage/*": ["src/storage/*"]
    }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 5. Environment Configuration

### 5.1 .env.example

```bash
# Server Configuration
PORT=3000
GATEWAY_PORT=21981
HOST=127.0.0.1

# Database
DATABASE_PATH=./data/secuclaw.db

# LLM Providers (optional defaults)
DEFAULT_LLM_PROVIDER=openai
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://api.openai.com/v1
ANTHROPIC_API_KEY=sk-ant-xxx
AZURE_OPENAI_KEY=xxx
AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com/

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Security
JWT_SECRET=your-secret-key-change-in-production
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Features
ENABLE_CHANNELS=true
ENABLE_SKILLS_MARKET=true
ENABLE_AI_EXPERTS=true
```

### 5.2 config/default.json

```json
{
  "server": {
    "port": 3000,
    "gatewayPort": 21981,
    "host": "127.0.0.1"
  },
  "database": {
    "path": "./data/secuclaw.db",
    "journalMode": "WAL"
  },
  "logging": {
    "level": "info",
    "format": "json",
    "outputs": ["console", "file"]
  },
  "features": {
    "channels": true,
    "skillsMarket": true,
    "aiExperts": true,
    "knowledgeBase": true
  },
  "i18n": {
    "defaultLocale": "zh-CN",
    "supportedLocales": ["zh-CN", "en", "zh-TW"]
  },
  "theme": {
    "default": "dark",
    "options": ["light", "dark", "system"]
  }
}
```

### 5.3 config/logging.json

```json
{
  "level": "info",
  "format": "json",
  "outputs": [
    {
      "type": "console",
      "colorize": true
    },
    {
      "type": "file",
      "path": "./logs/secuclaw.log",
      "rotation": {
        "enabled": true,
        "maxSize": "10m",
        "maxFiles": 5
      }
    }
  ],
  "categories": {
    "gateway": "debug",
    "knowledge": "info",
    "llm": "debug",
    "channels": "info"
  }
}
```

---

## 6. Scripts Reference

### 6.1 Available Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm dev` | Start frontend and backend in dev mode |
| `pnpm dev:ui` | Start only frontend dev server (port 3000) |
| `pnpm dev:core` | Start only backend gateway (port 21981) |
| `pnpm build` | Build all packages for production |
| `pnpm build:ui` | Build frontend to `ui/dist/` |
| `pnpm build:core` | Build backend to `packages/core/dist/` |
| `pnpm start` | Start production backend server |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all code |
| `pnpm clean` | Remove all build artifacts and node_modules |

### 6.2 Development Workflow

```bash
# 1. Initial setup
git clone <repo>
cd secuclaw
pnpm install

# 2. Development
pnpm dev

# 3. Build for production
pnpm build

# 4. Start production server
pnpm start
```

---

## 7. Development Setup Commands

### 7.1 Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Bun runtime (optional, for faster backend)

### 7.2 Step-by-Step Setup

```bash
# Step 1: Clone repository
git clone <repository-url>
cd secuclaw

# Step 2: Install pnpm (if not installed)
npm install -g pnpm

# Step 3: Install dependencies
pnpm install

# Step 4: Copy environment file
cp .env.example .env

# Step 5: Edit environment variables
nano .env

# Step 6: Create necessary directories
mkdir -p logs data

# Step 7: Start development servers
pnpm dev

# Frontend will be available at: http://localhost:3000
# Backend gateway at: ws://127.0.0.1:21981
```

### 7.3 Production Build

```bash
# Build all packages
pnpm build

# Start production server
pnpm start

# Or with PM2
pm2 start pnpm --name "secuclaw" -- start
```

---

## 8. Dependency Summary

### 8.1 Frontend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| lit | ^3.1.2 | Web Components framework |
| @lit/reactive-element | ^2.0.4 | Reactive state management |
| @vaadin/router | ^1.7.5 | Client-side routing |
| vite | ^5.0.12 | Build tool and dev server |
| typescript | ^5.3.3 | TypeScript compiler |

### 8.2 Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| ws | ^8.16.0 | WebSocket server |
| better-sqlite3 | ^9.4.0 | SQLite database |
| gray-matter | ^4.0.3 | YAML front-matter parser |
| yaml | ^2.3.4 | YAML parser |

---

## 9. Verification Checklist

After setup, verify:

- [ ] `pnpm install` completes without errors
- [ ] `pnpm dev:core` starts backend on port 21981
- [ ] `pnpm dev:ui` starts frontend on port 3000
- [ ] WebSocket connects at `ws://127.0.0.1:21981/ws`
- [ ] Frontend loads in browser at `http://localhost:3000`
- [ ] `pnpm build` completes for both packages
- [ ] TypeScript compiles without errors (`pnpm exec tsc --noEmit`)

---

*End of SPEC-01: Project Initialization*
