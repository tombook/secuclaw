# SecuClaw UI Design Analysis

## Current State

### Architecture
- **138 Lit panels** (1.9M+ lines), each self-contained with inline `static styles = css`
- **7-layer CSS architecture**: reset → base → theme → component → utility → responsive → accessibility
- **Panel container** (`sc-tool-panel.ts`): 3 modes (slide/modal/fullscreen), fixed positioning, CSS variable theming
- **Shared components**: severity-badge, progress-ring, status-indicator, live-clock

### Design System Variables
- Dark theme default with light mode support via `[data-theme="light"]`
- 30+ CSS custom properties for colors, spacing, shadows, radii, transitions
- Severity palette: critical/high/medium/low/info with bg/border variants
- Brand: primary (#00d4ff cyan), secondary (#7c3aed purple)

### Panel Pattern (all 138 panels follow this)
```
:host { display: block; font-family: 'Inter'; color: #e2e8f0; }
.panel { background: #111827; border-radius: 12px; padding: 20px; }
.pt { font-size: 16px; font-weight: 700; }  // panel title
```
- Each panel has its own inline CSS with hardcoded colors (not using CSS variables)
- No shared animation system beyond global.css
- No glass morphism, no hover micro-interactions, no modern UI patterns

### Gaps Identified

1. **No glass morphism** - All panels use flat solid backgrounds
2. **No hover micro-interactions** - Cards/items lack lift/glow effects
3. **No animation utilities** - Only 3 basic animations in global.css (fade-in, slide-in, pulse-glow)
4. **Limited data density options** - No compact/dense variants
5. **Panel container** - Basic slide transition, no backdrop blur, flat header
6. **Shared components** - Missing sparkline, gauge, mini bar chart
7. **Status indicators** - Basic pulse only, no gradient ring or advanced states
8. **Hardcoded colors** - Panels don't leverage the CSS variable system

### Design Improvement Plan

#### Phase 2A: Global CSS Enhancements
- Add glass morphism utilities (.glass, .glass-card, .glass-subtle)
- Add hover interaction utilities (.hover-lift, .hover-glow, .hover-scale)
- Add density utilities (.compact, .dense)
- Add advanced shadow utilities (.shadow-colored, .shadow-neon)
- Add animation keyframes (.animate-slide-up, .animate-scale-in, .animate-fade-scale)
- Add gradient utilities (.gradient-primary, .gradient-text)

#### Phase 2B: Shared Chart Components
- SVG gauge (half-circle arc with value)
- Sparkline (mini line chart from data points)
- Mini bar chart (horizontal/vertical)
- Advanced status indicator with gradient ring

#### Phase 2C: Panel Container
- Backdrop blur on overlay
- Gradient header bar
- Smooth cubic-bezier transitions
- Resize handle visual placeholder

#### Phase 2D: Panel Enhancements (5 panels)
1. sc-alert-correlation.ts - glass cards, severity badge glow
2. sc-vuln-management-workflow.ts - progress rings, workflow stages
3. sc-incident-timeline-viz.ts - sparklines, event hover effects
4. sc-cloud-posture.ts - hover lift, compact density
5. sc-compliance-map.ts - animated status indicators
