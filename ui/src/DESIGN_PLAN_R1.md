# SecuClaw UI Design Optimization — Round 1 Plan

## Current State Analysis

### Global CSS Inventory (global.css — 893 lines)
**Existing CSS Layer Architecture:**
- `@layer reset, base, theme, component, utility, responsive, accessibility`
- Theme variables: 60+ CSS custom properties (dark + light mode)
- Component classes: `.zone`, `.zone-title`, `.btn` (4 variants), `.badge` (7 severity levels), `.status-dot` (4 states), `.input`, `.progress-bar`/`.progress-fill` (4 colors), `.card`/`.card-header`/`.card-body`, `.table`
- Animations: `pulse-glow`, `fade-in`, `slide-in-right`, `slide-up`, `scale-in`, `fade-scale`, `shimmer`, `glow-pulse`, `float`, `border-glow`, `badge-pulse`
- Utility classes: `.sr-only`, `.truncate`, `.text-*`, `.font-*`, `.flex*`, `.grid`, spacing, `.hidden`, `.cursor-*`, `.overflow-*`
- Glass morphism: `.glass`, `.glass-card`, `.glass-subtle`
- Hover effects: `.hover-lift`, `.hover-glow`, `.hover-glow-danger`, `.hover-glow-success`, `.hover-scale`
- Gradients: `.gradient-primary`, `.gradient-success`, `.gradient-danger`, `.gradient-text`, `.border-gradient`
- Rings: `.ring-primary`, `.ring-success`, `.ring-danger`
- Shadows: `.shadow-colored`, `.shadow-neon`, `.shadow-inset`

### Shared Components Inventory (sc-chart-components.ts)
- `SeverityBadge` — severity badge with 5 levels
- `ProgressRing` — SVG circular progress with value/label
- `StatusIndicator` — dot + label with pulse animation
- `LiveClock` — real-time clock
- `SvgGauge` — half-circle arc gauge
- `SparklineChart` — inline SVG sparkline
- `MiniBarChart` — small horizontal bar chart
- `StatusDot` — simple colored dot

### Panel Inventory
- **120+ panels** in `ui/src/components/tool-panels/panels/`
- All follow similar pattern: ~400 lines CSS + 8000+ lines TS
- Each panel is a LitElement with `static styles = css\`...\`` block
- Render methods contain inline HTML with mock data initialization

## Gap Analysis

### Missing Modern UI Patterns
1. **No gradient-border data cards** — cards lack the subtle gradient border that modern security dashboards use
2. **No large stat value display** — numbers shown in plain text, no gradient text effect
3. **No animated pulse badges** — badges are static, no attention-grabbing animation
4. **No timeline connector** — incident/audit timelines lack visual connectors
5. **No responsive auto-fill grid** — panels use fixed column counts
6. **No multi-line truncation** — only single-line `.truncate` exists
7. **No skeleton loading** — loading states use spinners only
8. **No tooltip trigger class** — only `data-tooltip` attribute, no reusable CSS class
9. **No animated tab indicator** — tabs use simple border-bottom switch
10. **No scroll shadow** — scrollable areas have no top/bottom fade indication
11. **No stacked progress bar** — only single-color progress bars
12. **No icon button** — buttons always have text

## Files to Modify

### Phase 3A: Global CSS
- `ui/src/styles/global.css` — Append 12 new utility classes to existing layer sections

### Phase 3B: 10 Panels (sorted first 10)
1. `sc-access-matrix.ts` (line 399)
2. `sc-alert-correlation.ts` (line 414)
3. `sc-alert-system.ts` (line 421)
4. `sc-api-security.ts` (line 421)
5. `sc-apt-simulator.ts` (line 391)
6. `sc-arch-review.ts` (line 421)
7. `sc-architecture-attack.ts` (line 410)
8. `sc-asset-inventory-mgmt.ts` (line 300)
9. `sc-asset-inventory.ts` (line 399)
10. `sc-attack-path-discovery.ts` (line 397)

### Phase 3C: Tool Panel Container
- `ui/src/components/tool-panels/sc-tool-panel.ts`

## Priority Ranking
1. **P0**: Global CSS additions (3A) — foundation for all other changes
2. **P0**: Tool panel container enhancements (3C) — affects all panels
3. **P1**: Panel CSS additions (3B) — visual improvements per panel

## Implementation Notes
- All CSS additions go into existing `@layer` blocks to maintain cascade order
- No `${}` interpolation in css`` tagged templates (Lit rule)
- Use Python script for batch panel modifications (12000+ line files)
- Each panel gets ~25 lines of new CSS rules appended to static styles
- Render methods get global utility class references added to existing elements
