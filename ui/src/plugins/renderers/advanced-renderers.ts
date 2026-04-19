/**
 * 高级结果渲染器
 * Chart (SVG) / Radar (SVG) / Timeline / JsonTree / Progress Bar
 *
 * 所有渲染器纯 Lit html 模板，不依赖第三方图表库
 */

import { html, nothing, type TemplateResult } from 'lit';
import type { ResultDisplayDef, StandardToolResult } from '../types';

// ─── Chart 渲染器 (SVG bar/line/pie) ────────────────

export function renderChart(def: ResultDisplayDef, result: StandardToolResult): TemplateResult {
  const cfg = def.chartConfig;
  if (!cfg) return html`<div class="result-empty">缺少 chartConfig</div>`;

  switch (cfg.chartType) {
    case 'bar': return renderBarChart(cfg, result);
    case 'line': return renderLineChart(cfg, result);
    case 'pie': return renderPieChart(cfg, result);
    case 'radar': return renderRadarChart(cfg, result);
    case 'gauge': return renderGaugeChart(cfg, result);
    default: return renderBarChart(cfg, result);
  }
}

function renderBarChart(
  cfg: NonNullable<ResultDisplayDef['chartConfig']>,
  result: StandardToolResult,
): TemplateResult {
  const rows = result.rows;
  const xField = cfg.xField;
  const yField = cfg.yField;
  const colors = cfg.colors ?? ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];
  const maxVal = Math.max(...rows.map(r => Number(r[yField]) || 0), 1);

  const barW = 32;
  const gap = 12;
  const svgW = rows.length * (barW + gap) + 40;
  const svgH = 160;
  const chartH = 120;
  const baseline = chartH + 10;

  return html`
    <div class="chart-wrap">
      <svg width="100%" viewBox="0 0 ${svgW} ${svgH}" class="result-chart">
        <!-- Grid lines -->
        ${[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = baseline - pct * chartH;
          return html`<line x1="30" y1=${y} x2=${svgW - 10} y2=${y} stroke="#1e293b" stroke-width="0.5"/>`;
        })}
        <!-- Bars -->
        ${rows.map((row, i) => {
          const val = Number(row[yField]) || 0;
          const h = (val / maxVal) * chartH;
          const x = 30 + i * (barW + gap);
          const color = colors[i % colors.length];
          return html`
            <rect x=${x} y=${baseline - h} width=${barW} height=${h} rx="3" fill=${color} opacity="0.85">
              <animate attributeName="height" from="0" to=${h} dur="400ms" fill="freeze"/>
              <animate attributeName="y" from=${baseline} to=${baseline - h} dur="400ms" fill="freeze"/>
            </rect>
            <text x=${x + barW / 2} y=${baseline + 14} text-anchor="middle" fill="#64748b" font-size="9">${String(row[xField] ?? '').slice(0, 8)}</text>
            <text x=${x + barW / 2} y=${baseline - h - 4} text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600">${val}</text>
          `;
        })}
      </svg>
    </div>
    ${result.summary ? renderSummary(result) : nothing}
  `;
}

function renderLineChart(
  cfg: NonNullable<ResultDisplayDef['chartConfig']>,
  result: StandardToolResult,
): TemplateResult {
  const rows = result.rows;
  const xField = cfg.xField;
  const yField = cfg.yField;
  const color = (cfg.colors ?? ['#3b82f6'])[0];
  const maxVal = Math.max(...rows.map(r => Number(r[yField]) || 0), 1);

  const svgW = Math.max(rows.length * 50 + 40, 200);
  const svgH = 160;
  const chartH = 120;
  const baseline = chartH + 10;
  const stepX = (svgW - 60) / Math.max(rows.length - 1, 1);

  const points = rows.map((row, i) => {
    const x = 30 + i * stepX;
    const y = baseline - (Number(row[yField]) || 0) / maxVal * chartH;
    return `${x},${y}`;
  });
  const pathD = points.length > 0 ? `M${points.join('L')}` : '';

  return html`
    <div class="chart-wrap">
      <svg width="100%" viewBox="0 0 ${svgW} ${svgH}" class="result-chart">
        <!-- Grid -->
        ${[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = baseline - pct * chartH;
          return html`<line x1="30" y1=${y} x2=${svgW - 10} y2=${y} stroke="#1e293b" stroke-width="0.5"/>`;
        })}
        <!-- Area fill -->
        ${points.length > 1 ? html`<path d="${pathD} L${30 + (rows.length - 1) * stepX},${baseline} L30,${baseline} Z" fill="${color}15"/>` : nothing}
        <!-- Line -->
        <path d=${pathD} fill="none" stroke=${color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Dots + Labels -->
        ${rows.map((row, i) => {
          const x = 30 + i * stepX;
          const y = baseline - (Number(row[yField]) || 0) / maxVal * chartH;
          return html`
            <circle cx=${x} cy=${y} r="3.5" fill=${color} stroke="#0f172a" stroke-width="2"/>
            <text x=${x} y=${baseline + 14} text-anchor="middle" fill="#64748b" font-size="9">${String(row[xField] ?? '').slice(0, 8)}</text>
          `;
        })}
      </svg>
    </div>
    ${result.summary ? renderSummary(result) : nothing}
  `;
}

function renderPieChart(
  cfg: NonNullable<ResultDisplayDef['chartConfig']>,
  result: StandardToolResult,
): TemplateResult {
  const rows = result.rows;
  const yField = cfg.yField;
  const xField = cfg.xField;
  const colors = cfg.colors ?? ['#3b82f6', '#ef4444', '#f59e0b', '#22c55e', '#a78bfa', '#06b6d4'];
  const total = rows.reduce((sum, r) => sum + (Number(r[yField]) || 0), 0) || 1;

  const cx = 80, cy = 80, r = 60;
  let cumAngle = -90; // start from top

  const slices = rows.map((row, i) => {
    const val = Number(row[yField]) || 0;
    const angle = (val / total) * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;
    const largeArc = angle > 180 ? 1 : 0;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const pathD = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`;
    const color = colors[i % colors.length];
    const label = String(row[xField] ?? '');
    const pct = Math.round((val / total) * 100);
    return { pathD, color, label, val, pct };
  });

  return html`
    <div class="chart-wrap" style="display:flex;gap:16px;align-items:center">
      <svg width="160" height="160" viewBox="0 0 160 160" class="result-chart">
        ${slices.map(s => html`<path d=${s.pathD} fill=${s.color} stroke="#0f172a" stroke-width="1.5" opacity="0.85"/>`)}
        <circle cx=${cx} cy=${cy} r="30" fill="#0f172a"/>
        <text x=${cx} y=${cy + 1} text-anchor="middle" dominant-baseline="middle" fill="#e2e8f0" font-size="14" font-weight="700">${total}</text>
      </svg>
      <div class="chart-legend">
        ${slices.map(s => html`
          <div class="legend-item">
            <span class="legend-dot" style="background:${s.color}"></span>
            <span class="legend-label">${s.label}</span>
            <span class="legend-value">${s.val} (${s.pct}%)</span>
          </div>
        `)}
      </div>
    </div>
  `;
}

// ─── Radar 渲染器 (SVG) ─────────────────────────────

export function renderRadarChart(
  cfg: NonNullable<ResultDisplayDef['chartConfig']>,
  result: StandardToolResult,
): TemplateResult {
  const row = result.rows[0] ?? {};
  const fields = Object.keys(row).filter(k => typeof row[k] === 'number');
  const maxVal = Math.max(...fields.map(k => Number(row[k]) || 0), 1);
  const n = fields.length;
  const cx = 100, cy = 100, r = 75;
  const angleStep = (2 * Math.PI) / n;

  // Grid rings
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Data polygon
  const dataPoints = fields.map((f, i) => {
    const val = (Number(row[f]) || 0) / maxVal;
    const angle = -Math.PI / 2 + i * angleStep;
    return { x: cx + val * r * Math.cos(angle), y: cy + val * r * Math.sin(angle) };
  });
  const polygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return html`
    <div class="chart-wrap" style="display:flex;justify-content:center">
      <svg width="200" height="200" viewBox="0 0 200 200" class="result-chart">
        <!-- Grid rings -->
        ${rings.map(pct => {
          const pts = fields.map((_, i) => {
            const angle = -Math.PI / 2 + i * angleStep;
            return `${cx + pct * r * Math.cos(angle)},${cy + pct * r * Math.sin(angle)}`;
          });
          return html`<polygon points=${pts.join(' ')} fill="none" stroke="#1e293b" stroke-width="0.5"/>`;
        })}
        <!-- Axis lines -->
        ${fields.map((_, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          return html`<line x1=${cx} y1=${cy} x2=${cx + r * Math.cos(angle)} y2=${cy + r * Math.sin(angle)} stroke="#1e293b" stroke-width="0.5"/>`;
        })}
        <!-- Data polygon -->
        <polygon points=${polygon} fill="#3b82f625" stroke="#3b82f6" stroke-width="2"/>
        <!-- Data dots + labels -->
        ${fields.map((f, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          const dp = dataPoints[i];
          const labelR = r + 18;
          return html`
            <circle cx=${dp.x} cy=${dp.y} r="3" fill="#3b82f6" stroke="#0f172a" stroke-width="1.5"/>
            <text x=${cx + labelR * Math.cos(angle)} y=${cy + labelR * Math.sin(angle)}
              text-anchor="middle" dominant-baseline="middle" fill="#94a3b8" font-size="9">
              ${f} (${row[f]})
            </text>
          `;
        })}
      </svg>
    </div>
  `;
}

function renderGaugeChart(
  cfg: NonNullable<ResultDisplayDef['chartConfig']>,
  result: StandardToolResult,
): TemplateResult {
  const row = result.rows[0] ?? {};
  const val = Number(row[cfg.yField]) || 0;
  const maxVal = 100;
  const pct = Math.min(val / maxVal, 1);
  const color = pct >= 0.7 ? '#22c55e' : pct >= 0.4 ? '#f59e0b' : '#ef4444';

  const cx = 80, cy = 80, r = 60;
  const startAngle = -225;
  const endAngle = 45;
  const sweep = endAngle - startAngle;
  const valAngle = startAngle + pct * sweep;

  function arc(a: number): string {
    const rad = (a * Math.PI) / 180;
    return `${cx + r * Math.cos(rad)},${cy + r * Math.sin(rad)}`;
  }

  return html`
    <div class="chart-wrap" style="display:flex;flex-direction:column;align-items:center">
      <svg width="160" height="120" viewBox="0 0 160 120">
        <!-- Background arc -->
        <path d="M${arc(startAngle)} A${r},${r} 0 1 1 ${arc(endAngle)}" fill="none" stroke="#1e293b" stroke-width="10" stroke-linecap="round"/>
        <!-- Value arc -->
        <path d="M${arc(startAngle)} A${r},${r} 0 ${pct > 0.75 ? 1 : 0} 1 ${arc(valAngle)}" fill="none" stroke=${color} stroke-width="10" stroke-linecap="round"/>
        <!-- Value text -->
        <text x=${cx} y=${cy} text-anchor="middle" dominant-baseline="middle" fill="#e2e8f0" font-size="28" font-weight="800">${val}</text>
      </svg>
      <div style="font-size:11px;color:#94a3b8;margin-top:-8px">${cfg.yField}</div>
    </div>
  `;
}

// ─── Timeline 渲染器 ─────────────────────────────────

export function renderTimeline(def: ResultDisplayDef, result: StandardToolResult): TemplateResult {
  const cols = def.columns ?? [];
  const timeCol = cols[0]?.field ?? 'time';
  const titleCol = cols[1]?.field ?? 'title';
  const descCol = cols[2]?.field ?? 'description';

  return html`
    ${result.summary ? renderSummary(result) : nothing}
    <div class="result-timeline">
      ${result.rows.map((row, i) => {
        const isLast = i === result.rows.length - 1;
        return html`
          <div class="tl-item">
            <div class="tl-line">
              <div class="tl-dot" style="background:${i === 0 ? '#3b82f6' : '#334155'}"></div>
              ${!isLast ? html`<div class="tl-connector"></div>` : nothing}
            </div>
            <div class="tl-content">
              <div class="tl-time">${String(row[timeCol] ?? '')}</div>
              <div class="tl-title">${String(row[titleCol] ?? '')}</div>
              ${row[descCol] ? html`<div class="tl-desc">${String(row[descCol])}</div>` : nothing}
              ${cols.slice(3).map(c => {
                const v = row[c.field];
                return v != null ? html`<span class="cell-badge" style="background:#1e293b;color:#94a3b8;margin-right:4px;margin-top:2px">${v}</span>` : nothing;
              })}
            </div>
          </div>
        `;
      })}
    </div>
  `;
}

// ─── JsonTree 渲染器 ─────────────────────────────────

export function renderJsonTree(def: ResultDisplayDef, result: StandardToolResult): TemplateResult {
  const data = result.rows[0] ?? {};
  return html`
    <div class="result-json-tree">
      ${_renderJsonNode(data, 0)}
    </div>
  `;
}

function _renderJsonNode(obj: unknown, depth: number): TemplateResult {
  if (obj === null || obj === undefined) {
    return html`<span class="jt-null">null</span>`;
  }
  if (typeof obj === 'boolean') {
    return html`<span class="jt-bool">${obj}</span>`;
  }
  if (typeof obj === 'number') {
    return html`<span class="jt-num">${obj}</span>`;
  }
  if (typeof obj === 'string') {
    return html`<span class="jt-str">"${obj.length > 80 ? obj.slice(0, 80) + '…' : obj}"</span>`;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return html`<span class="jt-bracket">[]</span>`;
    return html`
      <span class="jt-bracket">[</span>
      <div style="padding-left:${(depth + 1) * 14}px">
        ${obj.slice(0, 20).map((item, i) => html`
          <div>${_renderJsonNode(item, depth + 1)}${i < Math.min(obj.length, 20) - 1 ? html`<span class="jt-comma">,</span>` : nothing}</div>
        `)}
        ${obj.length > 20 ? html`<div class="jt-more">… ${obj.length - 20} more items</div>` : nothing}
      </div>
      <span class="jt-bracket">]</span>
    `;
  }
  const entries = Object.entries(obj as Record<string, unknown>);
  if (entries.length === 0) return html`<span class="jt-bracket">{}</span>`;
  return html`
    <span class="jt-bracket">{</span>
    <div style="padding-left:${(depth + 1) * 14}px">
      ${entries.map(([k, v], i) => html`
        <div><span class="jt-key">"${k}"</span>: ${_renderJsonNode(v, depth + 1)}${i < entries.length - 1 ? html`<span class="jt-comma">,</span>` : nothing}</div>
      `)}
    </div>
    <span class="jt-bracket">}</span>
  `;
}

// ─── Custom Renderer 注册表 ──────────────────────────

type CustomRendererFn = (def: ResultDisplayDef, result: StandardToolResult) => TemplateResult;

const CUSTOM_RENDERERS = new Map<string, CustomRendererFn>();

export function registerCustomRenderer(id: string, fn: CustomRendererFn): void {
  CUSTOM_RENDERERS.set(id, fn);
}

export function getCustomRenderer(id: string): CustomRendererFn | undefined {
  return CUSTOM_RENDERERS.get(id);
}

// ─── Summary 通用渲染 ────────────────────────────────

function renderSummary(result: StandardToolResult): TemplateResult {
  return html`
    <div class="result-summary">
      ${Object.entries(result.summary ?? {}).map(([k, v]) => html`
        <span class="summary-item">
          <span class="summary-label">${k}</span>
          <span class="summary-value">${v}</span>
        </span>
      `)}
    </div>
  `;
}
