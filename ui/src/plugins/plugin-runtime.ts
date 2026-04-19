/**
 * SecuClaw Plugin Runtime — 面板渲染引擎
 * 根据 ToolPluginManifest 动态生成表单和结果区域
 */

import { html, nothing, type TemplateResult } from 'lit';
import type { FormFieldDef, ResultDisplayDef, StandardToolResult, ToolPluginManifest } from './types';
import { MOCK_RESPONSES } from './mock-responses';
import { renderChart, renderRadarChart, renderTimeline, renderJsonTree, getCustomRenderer } from './renderers/advanced-renderers';
import { ADVANCED_RENDERER_CSS } from './renderers/advanced-renderer-css';
import { shouldShowField, renderAdvancedField } from './renderers/advanced-form';
import { adapterRegistry } from './adapters/adapter-registry';

// ─── 表单渲染器 ───────────────────────────────────────

export function renderPluginForm(
  manifest: ToolPluginManifest,
  formValues: Record<string, unknown>,
  onInput: (name: string, value: unknown) => void,
  onExecute: () => void,
  executing: boolean,
  theme: { primary: string },
): TemplateResult {
  const fields = manifest.ui.form.filter(f => shouldShowField(f, formValues));
  const groups = [...new Set(fields.map(f => f.group ?? '').filter(Boolean))];
  const ungrouped = fields.filter(f => !f.group);

  return html`
    <div class="plugin-form">
      ${ungrouped.map(f => renderField(f, formValues, onInput, theme))}
      ${groups.map(g => html`
        <div class="form-group">
          <div class="form-group-label">${g}</div>
          ${fields.filter(f => f.group === g).map(f => renderField(f, formValues, onInput, theme))}
        </div>
      `)}
      <div class="form-actions">
        <button
          class="exec-btn"
          style="background:${theme.primary}"
          ?disabled=${executing}
          @click=${onExecute}
        >
          ${executing ? html`<span class="spin">⏳</span> 执行中...` : '▶ 执行'}
        </button>
      </div>
    </div>
  `;
}

function renderField(
  f: FormFieldDef,
  values: Record<string, unknown>,
  onInput: (name: string, value: unknown) => void,
  theme: { primary: string },
): TemplateResult {
  const val = values[f.name] ?? f.defaultValue ?? '';

  const label = html`<label class="field-label">${f.required ? html`<span class="req">*</span>` : nothing}${f.label}</label>`;

  // Try advanced field types first
  const advanced = renderAdvancedField(f, values, onInput, theme);
  if (advanced) return advanced;

  switch (f.type) {
    case 'text':
      return html`<div class="field">${label}<input type="text" class="field-input" placeholder=${f.placeholder ?? ''} .value=${val as string} @input=${(e: Event) => onInput(f.name, (e.target as HTMLInputElement).value)} /></div>`;

    case 'select':
      return html`<div class="field">${label}<select class="field-select" @change=${(e: Event) => onInput(f.name, (e.target as HTMLSelectElement).value)}>
        ${f.options?.map(o => html`<option value=${o.value} ?selected=${o.value === val}>${o.label}</option>`)}
      </select></div>`;

    case 'multiselect':
      return html`<div class="field">${label}<div class="multi-options">
        ${f.options?.map(o => {
          const selected = (val as string[] ?? []).includes(o.value);
          return html`<button class="multi-opt ${selected ? 'selected' : ''}" style="${selected ? `border-color:${theme.primary};color:${theme.primary};background:${theme.primary}18` : ''}" @click=${() => {
            const arr = new Set<string>(val as string[] ?? []);
            selected ? arr.delete(o.value) : arr.add(o.value);
            onInput(f.name, [...arr]);
          }}>${o.label}</button>`;
        })}
      </div></div>`;

    case 'textarea':
      return html`<div class="field">${label}<textarea class="field-textarea" placeholder=${f.placeholder ?? ''} .value=${val as string} @input=${(e: Event) => onInput(f.name, (e.target as HTMLTextAreaElement).value)}></textarea></div>`;

    case 'number':
      return html`<div class="field">${label}<input type="number" class="field-input" placeholder=${f.placeholder ?? ''} .value=${val as number} min=${f.validation?.min ?? ''} max=${f.validation?.max ?? ''} @input=${(e: Event) => onInput(f.name, Number((e.target as HTMLInputElement).value))} /></div>`;

    case 'toggle':
      return html`<div class="field">${label}<label class="toggle"><input type="checkbox" ?checked=${val as boolean} @change=${(e: Event) => onInput(f.name, (e.target as HTMLInputElement).checked)} /><span class="toggle-slider"></span></label></div>`;

    case 'tag-input':
      return html`<div class="field">${label}<div class="tag-input-wrap">${(val as string[] ?? []).map((t: string, i: number) => html`<span class="tag-item">${t}<button class="tag-remove" @click=${() => { const arr = [...(val as string[] ?? [])]; arr.splice(i, 1); onInput(f.name, arr); }}>×</button></span>`)}<input type="text" class="tag-field" placeholder=${f.placeholder ?? '回车添加'} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) { e.preventDefault(); const arr = [...(val as string[] ?? []), (e.target as HTMLInputElement).value.trim()]; onInput(f.name, arr); (e.target as HTMLInputElement).value = ''; } }} /></div></div>`;

    default:
      return html`<div class="field">${label}<input type="text" class="field-input" .value=${val as string} @input=${(e: Event) => onInput(f.name, (e.target as HTMLInputElement).value)} /></div>`;
  }
}

// ─── 结果渲染器 ───────────────────────────────────────

export function renderPluginResult(
  manifest: ToolPluginManifest,
  result: StandardToolResult | null,
  executing: boolean,
): TemplateResult {
  if (executing) {
    return html`<div class="result-loading"><span class="spin">⏳</span> ${manifest.ui.result.loadingText ?? '执行中...'}</div>`;
  }

  if (!result) {
    return html`<div class="result-empty">${manifest.ui.result.emptyText ?? '点击执行查看结果'}</div>`;
  }

  if (result.status === 'error') {
    return html`<div class="result-error">❌ 执行失败：${result.error ?? '未知错误'}</div>`;
  }

  // ─── Render AI analysis if present ───
  const aiBlock = result.aiAnalysis ? renderAiAnalysis(result.aiAnalysis) : nothing;

  // ─── Render questionnaire if present ───
  if (result._meta?.type === 'questionnaire') {
    return renderQuestionnaire(result);
  }

  // ─── Render API adapter waiting state ───
  if (result._meta?.type === 'api-adapter' && !result.rows?.length) {
    return renderApiAdapterGuide(result);
  }

  const def = manifest.ui.result;

  switch (def.type) {
    case 'table': return renderTable(def, result);
    case 'cards': return renderCards(def, result);
    case 'progress-steps': return renderSteps(def, result);
    case 'markdown': return renderMarkdown(result);
    case 'chart': return renderChart(def, result);
    case 'radar': return renderChart(def, result);
    case 'timeline': return renderTimeline(def, result);
    case 'json-tree': return renderJsonTree(def, result);
    case 'composite': return renderComposite(def, result);
    case 'custom': {
      const renderer = def.customRenderer ? getCustomRenderer(def.customRenderer) : null;
      return renderer ? renderer(def, result) : renderTable(def, result);
    }
    default: return renderTable(def, result);
  }
}

function getColor(row: Record<string, unknown>, rule: { field: string; rules: Array<{ condition: string; value: unknown; color: string }> }): string {
  if (!rule) return '#94a3b8';
  const val = row[rule.field];
  for (const r of rule.rules) {
    switch (r.condition) {
      case 'eq': if (val === r.value) return r.color; break;
      case 'gt': if (Number(val) > Number(r.value)) return r.color; break;
      case 'gte': if (Number(val) >= Number(r.value)) return r.color; break;
      case 'lt': if (Number(val) < Number(r.value)) return r.color; break;
      case 'lte': if (Number(val) <= Number(r.value)) return r.color; break;
      case 'contains': if (String(val).includes(String(r.value))) return r.color; break;
    }
  }
  return '#94a3b8';
}

// ─── Composite Renderer (多区布局) ─────────────────────

function renderComposite(def: ResultDisplayDef, result: StandardToolResult): TemplateResult {
  const sections = def.sections ?? [];
  const summaryItems = def.summaryBar ?? [];
  const summary = result.summary ?? {};

  return html`
    ${summaryItems.length ? renderSummaryBar(summaryItems, summary) : nothing}
    ${sections.length ? html`
      <div class="composite-sections" style="display:flex;flex-direction:column;gap:12px">
        ${sections.map((sec) => {
          return html`
            <div class="composite-section" data-section="${sec.id}" style="flex:1">
              ${sec.title ? html`<div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:6px;padding-left:2px">${sec.title}</div>` : nothing}
              ${renderSingleResult(sec.display, result)}
            </div>
          `;
        })}
      </div>
    ` : nothing}
    ${result.aiAnalysis ? renderAiAnalysis(result.aiAnalysis) : nothing}
  `;
}

function renderSummaryBar(items: Array<{ field: string; label: string; icon?: string; color?: string }>, summary: Record<string, any>): TemplateResult {
  return html`
    <div style="display:flex;gap:8px;padding:8px 12px;background:#0f172a;border-radius:6px;margin-bottom:12px;flex-wrap:wrap">
      ${items.map(item => {
        const val = summary[item.field] ?? '-';
        return html`
          <div style="display:flex;align-items:center;gap:4px;padding:2px 8px;background:${(item.color ?? '#1e293b') + '22'};border-radius:4px">
            ${item.icon ? html`<span style="font-size:12px">${item.icon}</span>` : nothing}
            <span style="font-size:11px;color:#94a3b8">${item.label}</span>
            <span style="font-size:13px;font-weight:700;color:${item.color ?? '#e2e8f0'}">${val}</span>
          </div>
        `;
      })}
    </div>
  `;
}

function renderSingleResult(def: ResultDisplayDef, result: StandardToolResult): TemplateResult {
  switch (def.type) {
    case 'table': return renderTable(def, result);
    case 'cards': return renderCards(def, result);
    case 'chart': return renderChart(def, result);
    case 'radar': return renderChart(def, result);
    case 'timeline': return renderTimeline(def, result);
    case 'json-tree': return renderJsonTree(def, result);
    case 'markdown': return renderMarkdown(result);
    default: return renderTable(def, result);
  }
}

// ─── AI Analysis Renderer ─────────────────────────────

function renderAiAnalysis(ai: Record<string, any>): TemplateResult {
  const riskColors: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e', info: '#3b82f6' };
  const riskLabels: Record<string, string> = { critical: '严重', high: '高危', medium: '中等', low: '低', info: '信息' };
  const riskColor = riskColors[ai.riskLevel] ?? '#94a3b8';

  return html`
    <div class="ai-analysis-block" style="border:1px solid ${riskColor}33;border-radius:8px;padding:12px;margin-bottom:12px;background:${riskColor}08">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="font-size:14px">🤖</span>
        <span style="font-weight:700;font-size:13px;color:#e2e8f0">AI 分析</span>
        <span style="background:${riskColor}22;color:${riskColor};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">${riskLabels[ai.riskLevel] ?? ai.riskLevel}</span>
        ${ai.dataEnrichment ? html`<span style="color:#64748b;font-size:10px">SCF ${ai.dataEnrichment.scfControlsMatched} · MITRE ${ai.dataEnrichment.mitreTechniquesMatched}</span>` : nothing}
      </div>
      ${ai.analysis ? html`<div style="font-size:12px;color:#cbd5e1;line-height:1.6;margin-bottom:8px;white-space:pre-wrap">${ai.analysis}</div>` : nothing}
      ${ai.recommendations?.length ? html`
        <div style="margin-bottom:8px">
          <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">💡 建议</div>
          ${ai.recommendations.map((r: string) => html`<div style="font-size:12px;color:#e2e8f0;padding:2px 0">• ${r}</div>`)}
        </div>
      ` : nothing}
      ${ai.actionItems?.length ? html`
        <div style="margin-bottom:8px">
          <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">📋 行动项</div>
          ${ai.actionItems.map((a: any) => html`
            <div style="display:flex;gap:6px;font-size:11px;padding:2px 0;align-items:center">
              <span style="background:${a.priority === 'P1' ? '#ef4444' : a.priority === 'P2' ? '#f97316' : '#3b82f6'}22;color:${a.priority === 'P1' ? '#ef4444' : a.priority === 'P2' ? '#f97316' : '#3b82f6'};padding:1px 6px;border-radius:3px;font-weight:600">${a.priority}</span>
              <span style="color:#e2e8f0">${a.action}</span>
              <span style="color:#64748b">· ${a.deadline}</span>
            </div>
          `)}
        </div>
      ` : nothing}
      ${ai.boardSummary ? html`
        <div style="background:#0d1117;border-radius:4px;padding:8px;margin-top:8px">
          <div style="font-size:10px;color:#94a3b8;margin-bottom:4px">📊 向上汇报要点</div>
          <div style="font-size:12px;color:#e2e8f0;line-height:1.5">${ai.boardSummary}</div>
        </div>
      ` : nothing}
    </div>
  `;
}

// ─── Questionnaire Renderer ───────────────────────────

function renderQuestionnaire(result: StandardToolResult): TemplateResult {
  const questions: any[] = result._meta?.questions ?? [];
  return html`
    <div class="questionnaire-block">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="font-size:14px">📋</span>
        <span style="font-weight:700;color:#e2e8f0">SCF 控制项评估问卷</span>
        <span style="color:#64748b;font-size:11px">${questions.length} 题</span>
      </div>
      ${result.summary ? html`<div class="result-summary" style="margin-bottom:12px">${Object.entries(result.summary).map(([k, v]) => html`<span class="summary-item"><span class="summary-label">${k}</span><span class="summary-value">${v}</span></span>`)}</div>` : nothing}
      ${result.aiAnalysis ? renderAiAnalysis(result.aiAnalysis) : nothing}
      <div class="questionnaire-questions" style="max-height:400px;overflow-y:auto">
        ${questions.slice(0, 15).map((q: any, i: number) => html`
          <div style="border-bottom:1px solid #1e293b;padding:10px 0">
            <div style="display:flex;gap:8px;margin-bottom:6px">
              <span style="color:#3b82f6;font-size:11px;font-weight:600;min-width:60px">${q.id}</span>
              <span style="color:#94a3b8;font-size:10px">${q.domainName}</span>
            </div>
            <div style="color:#e2e8f0;font-size:12px;margin-bottom:8px">${q.text}</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              ${q.options.map((o: any) => html`
                <button class="q-option" data-qid="${q.id}" data-val="${o.value}"
                  style="font-size:10px;padding:3px 8px;border-radius:4px;border:1px solid #334155;background:transparent;color:#94a3b8;cursor:pointer"
                >${o.label}</button>
              `)}
            </div>
          </div>
        `)}
      </div>
    </div>
  `;
}

// ─── API Adapter Guide Renderer ───────────────────────

function renderApiAdapterGuide(result: StandardToolResult): TemplateResult {
  const meta = result._meta ?? {};
  return html`
    <div style="text-align:center;padding:24px;color:#94a3b8">
      <div style="font-size:24px;margin-bottom:8px">🔌</div>
      <div style="font-size:13px;font-weight:600;color:#e2e8f0;margin-bottom:8px">API 接入配置</div>
      <div style="font-size:12px;margin-bottom:16px">${meta.message ?? '请配置 API 连接或粘贴数据'}</div>
      <div style="text-align:left;background:#0d1117;border-radius:6px;padding:12px;font-size:11px">
        <div style="color:#94a3b8;margin-bottom:4px">API 端点: <span style="color:#3b82f6">${meta.endpoint ?? '-'}</span></div>
        <div style="color:#64748b;margin-top:8px">支持的接入方式:</div>
        <div style="color:#e2e8f0;padding-left:12px">
          • 配置 API 地址和 Key<br/>
          • 直接粘贴 JSON/CSV 数据<br/>
          • 通过后端中间件代理
        </div>
      </div>
      ${result.aiAnalysis ? renderAiAnalysis(result.aiAnalysis) : nothing}
    </div>
  `;
}

function renderTable(def: ResultDisplayDef, result: StandardToolResult): TemplateResult {
  const cols = def.columns ?? [];
  return html`
    ${result.summary ? html`<div class="result-summary">${Object.entries(result.summary).map(([k, v]) => html`<span class="summary-item"><span class="summary-label">${k}</span><span class="summary-value">${v}</span></span>`)}</div>` : nothing}
    <div class="result-table-wrap">
      <table class="result-table">
        <thead><tr>${cols.map(c => html`<th style=${c.width ? `width:${c.width}` : ''}>${c.label}</th>`)}</tr></thead>
        <tbody>${result.rows.map(row => html`<tr>${cols.map(c => {
          const val = row[c.field] ?? '';
          const color = c.colorRule ? getColor(row, c.colorRule) : '';
          switch (c.type) {
            case 'badge': return html`<td><span class="cell-badge" style="background:${color}22;color:${color}">${val}</span></td>`;
            case 'score': return html`<td><span class="cell-score" style="color:${color}">${val}</span></td>`;
            case 'tag': return html`<td><span class="cell-tag">${val}</span></td>`;
            case 'link': return html`<td><span class="cell-link">${val}</span></td>`;
            default: return html`<td>${val}</td>`;
          }
        })}</tr>`)}</tbody>
      </table>
    </div>
    ${result.aiAnalysis ? renderAiAnalysis(result.aiAnalysis) : nothing}
    <div class="result-footer">耗时 ${result.duration}ms · ${result.rows.length} 条结果</div>
  `;
}

function renderCards(def: ResultDisplayDef, result: StandardToolResult): TemplateResult {
  const cf = def.cardFields ?? { title: 'name', description: 'desc' };
  return html`
    ${result.summary ? html`<div class="result-summary">${Object.entries(result.summary).map(([k, v]) => html`<span class="summary-item"><span class="summary-label">${k}</span><span class="summary-value">${v}</span></span>`)}</div>` : nothing}
    <div class="result-cards">${result.rows.map(row => html`
      <div class="result-card">
        <div class="card-title">${row[cf.title] ?? ''}</div>
        ${cf.subtitle ? html`<div class="card-subtitle">${row[cf.subtitle] ?? ''}</div>` : nothing}
        ${cf.badges ? html`<div class="card-badges">${(cf.badges).map(b => html`<span class="cell-badge" style="background:#3b82f622;color:#3b82f6">${row[b] ?? ''}</span>`)}</div>` : nothing}
        ${cf.description ? html`<div class="card-desc">${row[cf.description] ?? ''}</div>` : nothing}
      </div>
    `)}</div>
  `;
}

function renderSteps(def: ResultDisplayDef, result: StandardToolResult): TemplateResult {
  return html`
    ${result.summary ? html`<div class="result-summary">${Object.entries(result.summary).map(([k, v]) => html`<span class="summary-item"><span class="summary-label">${k}</span><span class="summary-value">${v}</span></span>`)}</div>` : nothing}
    <div class="result-steps">${result.rows.map((row, i) => {
      const status = String(row.status ?? row[def.steps?.[i]?.statusField ?? 'status'] ?? '');
      const isSuccess = status === '成功' || status === '已完成';
      const isRunning = status === '进行中';
      return html`
        <div class="step-item ${isRunning ? 'running' : ''}">
          <div class="step-indicator ${isSuccess ? 'done' : isRunning ? 'active' : ''}">
            ${isSuccess ? '✓' : isRunning ? html`<span class="spin">⏳</span>` : (i + 1)}
          </div>
          <div class="step-content">
            <div class="step-label">${row.step ?? def.steps?.[i]?.label ?? ''}</div>
            <div class="step-detail">${row.detail ?? ''}</div>
          </div>
          <span class="step-status" style="color:${isSuccess ? '#22c55e' : isRunning ? '#3b82f6' : '#64748b'}">${status}</span>
        </div>
      `;
    })}</div>
  `;
}

function renderMarkdown(result: StandardToolResult): TemplateResult {
  const content = result.rows[0]?.content ?? '';
  const lines = String(content).split('\n');
  return html`<div class="result-markdown">${lines.map(line => {
    if (line.startsWith('# ')) return html`<h3>${line.slice(2)}</h3>`;
    if (line.startsWith('## ')) return html`<h4>${line.slice(3)}</h4>`;
    if (line.startsWith('- ')) return html`<div class="md-li">• ${line.slice(2)}</div>`;
    if (line.trim() === '') return html`<br/>`;
    return html`<p>${line}</p>`;
  })}</div>`;
}

// ─── Backend Detection & Execution Engine ─────────────

/** Backend connectivity state */
let _backendState: 'unknown' | 'available' | 'unavailable' = 'unknown';
let _backendCheckTime = 0;
const BACKEND_CHECK_INTERVAL = 60_000; // re-check every 60s
const BACKEND_HEALTH_ENDPOINT = '/api/v1/health';

/** Detect if real backend is reachable */
export async function detectBackend(): Promise<boolean> {
  // Throttle checks
  if (_backendState !== 'unknown' && Date.now() - _backendCheckTime < BACKEND_CHECK_INTERVAL) {
    return _backendState === 'available';
  }

  try {
    const resp = await fetch(BACKEND_HEALTH_ENDPOINT, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    const ok = resp.ok;
    _backendState = ok ? 'available' : 'unavailable';
  } catch {
    _backendState = 'unavailable';
  }
  _backendCheckTime = Date.now();
  return _backendState === 'available';
}

/** Get current backend state (synchronous) */
export function getBackendState(): 'unknown' | 'available' | 'unavailable' {
  return _backendState;
}

/** Force reset backend detection (e.g. after config change) */
export function resetBackendDetection(): void {
  _backendState = 'unknown';
  _backendCheckTime = 0;
}

/**
 * 执行工具 — 优先使用真实引擎，然后尝试后端 API，最后 fallback mock
 *
 * 流程：
 * 0. 先尝试真实工具执行器（SCF 问卷/MITRE 分析/AI 分析）
 * 1. 检测后端可用性（带缓存）
 * 2. 后端可用 → 通过 adapterRegistry 发送真实请求
 * 3. 真实请求失败 → fallback mock
 * 4. 后端不可用 → 直接 mock
 */
export async function executePlugin(
  manifest: ToolPluginManifest,
  formValues: Record<string, unknown>,
  roleId?: string,
): Promise<StandardToolResult> {
  // 0. Try real tool executor first (SCF questionnaire / MITRE analysis / AI)
  try {
    const { executeRealTool } = await import('./real-tool-executor');
    const role = (roleId ?? 'security-expert') as any;
    const realResult = await executeRealTool(manifest, formValues, role);
    // If real executor returned actual data (not empty waiting-for-data), use it
    if (realResult.rows?.length > 0 || realResult.aiAnalysis || realResult._meta?.type === 'questionnaire') {
      return realResult;
    }
  } catch (e) {
    console.warn(`[Plugin] ${manifest.meta.id} 真实执行器不可用，尝试 API:`, e);
  }

  // 1-4: Original backend/mock flow
  const backendAvailable = await detectBackend();

  if (!backendAvailable) {
    return executeMock(manifest, roleId);
  }

  // Try real API via adapter
  try {
    const startTime = performance.now();
    const result = await adapterRegistry.executeManifest(manifest, formValues);
    const duration = Math.round(performance.now() - startTime);

    if (result.status === 'error') {
      console.warn(`[Plugin] ${manifest.meta.id} API 失败，使用 mock: ${result.error}`);
      return executeMock(manifest, roleId);
    }

    // Inject duration if not present
    if (!result.duration) result.duration = duration;
    return result;
  } catch (e) {
    console.warn(`[Plugin] ${manifest.meta.id} adapter 不可用，使用 mock: ${e}`);
    return executeMock(manifest, roleId);
  }
}

/** Pure mock executor (always returns mock data) + AI analysis */
export async function executeMock(
  manifest: ToolPluginManifest,
  roleId?: string,
): Promise<StandardToolResult> {
  const mockFn = manifest.api.mockFn;
  const generator = mockFn ? MOCK_RESPONSES[mockFn] : null;
  if (!generator) {
    return { rows: [], status: 'error', duration: 0, error: `未找到 mock 函数: ${mockFn}` };
  }
  await new Promise(r => setTimeout(r, Math.min(manifest.api.timeout, 1500)));
  const result = generator();

  // Run AI analysis on mock data — this is the data → AI analysis bridge
  try {
    const { aiAnalysisEngine } = await import('./engines/ai-analysis-engine');
    const toolId = manifest.meta.id;
    const role = (roleId ?? 'security-expert') as any;

    // Extract summary & first row as input data for AI analysis
    const inputData: Record<string, unknown> = {
      toolId,
      toolName: manifest.meta.name,
      rowCount: result.rows?.length ?? 0,
      summary: result.summary ?? {},
      // Merge all row fields for richer analysis
      ...(result.rows?.slice(0, 3).reduce((acc: Record<string, unknown>, row: Record<string, unknown>, i: number) => {
        if (i === 0) Object.assign(acc, row); // First row fields at top level
        acc[`row${i + 1}`] = row; // All rows indexed
        return acc;
      }, {})),
    };

    const aiResult = await aiAnalysisEngine.analyze({
      toolId,
      role,
      inputData,
    });

    // Merge AI analysis into tool result
    result.aiAnalysis = {
      riskLevel: aiResult.riskLevel,
      analysis: aiResult.analysis,
      recommendations: aiResult.recommendations,
      actionItems: aiResult.actionItems,
      boardSummary: aiResult.boardSummary,
      dataEnrichment: aiResult.dataEnrichment,
    };
  } catch (e) {
    console.warn(`[executeMock] AI analysis failed for ${manifest.meta.id}:`, e);
    // Don't fail the whole execution — just skip AI analysis
  }

  return result;
}

// ─── 共享 CSS（注入到 sc-tool-panel） ──────────────────

export const PLUGIN_PANEL_CSS = `
  .plugin-form { display: flex; flex-direction: column; gap: 10px; padding: 10px; }
  .form-group { border-top: 1px solid #1e293b; padding-top: 8px; margin-top: 4px; }
  .form-group-label { font-size: 10px; color: #64748b; font-weight: 700; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
  .field { display: flex; flex-direction: column; gap: 3px; }
  .field-label { font-size: 10px; color: #94a3b8; font-weight: 600; }
  .field-label .req { color: #ef4444; margin-right: 2px; }
  .field-input, .field-select, .field-textarea {
    background: #0a0f1a; border: 1px solid #1e293b; border-radius: 4px;
    padding: 6px 10px; font-size: 12px; color: #e2e8f0; outline: none;
  }
  .field-input:focus, .field-select:focus { border-color: #3b82f6; }
  .field-textarea { min-height: 60px; resize: vertical; }
  .multi-options { display: flex; flex-wrap: wrap; gap: 4px; }
  .multi-opt {
    font-size: 10px; padding: 3px 8px; border-radius: 3px;
    border: 1px solid #334155; background: transparent; color: #94a3b8;
    cursor: pointer; transition: all 100ms;
  }
  .multi-opt:hover { border-color: #475569; }
  .multi-opt.selected { border-color: #3b82f6; color: #3b82f6; background: #3b82f618; }
  .tag-input-wrap { display: flex; flex-wrap: wrap; gap: 4px; background: #0a0f1a; border: 1px solid #1e293b; border-radius: 4px; padding: 4px 6px; }
  .tag-item { font-size: 10px; padding: 2px 6px; border-radius: 3px; background: #1e293b; color: #94a3b8; display: flex; align-items: center; gap: 4px; }
  .tag-remove { background: none; border: none; color: #64748b; cursor: pointer; font-size: 12px; padding: 0; line-height: 1; }
  .tag-remove:hover { color: #ef4444; }
  .tag-field { border: none; background: transparent; color: #e2e8f0; font-size: 11px; outline: none; flex: 1; min-width: 60px; }
  .toggle { position: relative; width: 36px; height: 20px; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle-slider { position: absolute; inset: 0; background: #334155; border-radius: 10px; cursor: pointer; transition: 150ms; }
  .toggle-slider::before { content: ''; position: absolute; left: 2px; top: 2px; width: 16px; height: 16px; background: #94a3b8; border-radius: 50%; transition: 150ms; }
  .toggle input:checked + .toggle-slider { background: #3b82f6; }
  .toggle input:checked + .toggle-slider::before { transform: translateX(16px); background: white; }
  .form-actions { display: flex; justify-content: flex-end; padding-top: 4px; }
  .exec-btn { font-size: 12px; padding: 6px 16px; border-radius: 4px; border: none; color: white; font-weight: 600; cursor: pointer; transition: opacity 100ms; }
  .exec-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .exec-btn:hover:not(:disabled) { opacity: 0.9; }

  .spin { display: inline-block; animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  .result-loading, .result-empty { text-align: center; padding: 30px; color: #64748b; font-size: 12px; }
  .result-error { padding: 12px; background: #ef444418; border: 1px solid #ef444433; border-radius: 4px; color: #ef4444; font-size: 12px; }
  .result-summary { display: flex; flex-wrap: wrap; gap: 8px; padding: 8px 10px; background: #0d1117; border-radius: 4px; margin-bottom: 8px; }
  .summary-item { display: flex; flex-direction: column; gap: 1px; }
  .summary-label { font-size: 9px; color: #475569; }
  .summary-value { font-size: 14px; font-weight: 700; color: #e2e8f0; }
  .result-table-wrap { overflow-x: auto; }
  .result-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .result-table th { padding: 5px 8px; text-align: left; color: #64748b; font-size: 10px; font-weight: 600; border-bottom: 1px solid #1e293b; }
  .result-table td { padding: 5px 8px; color: #94a3b8; border-bottom: 1px solid #0d1117; }
  .result-table tr:hover td { background: #1e293b22; }
  .cell-badge { font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 3px; }
  .cell-score { font-weight: 800; }
  .cell-tag { font-size: 10px; padding: 1px 5px; border-radius: 3px; background: #1e293b; }
  .cell-link { color: #60a5fa; cursor: pointer; }
  .cell-link:hover { text-decoration: underline; }
  .result-footer { font-size: 9px; color: #475569; padding-top: 6px; text-align: right; }
  .result-cards { display: flex; flex-direction: column; gap: 6px; }
  .result-card { padding: 8px 10px; background: #111827; border: 1px solid #1e293b; border-radius: 4px; }
  .card-title { font-size: 12px; font-weight: 600; color: #e2e8f0; }
  .card-subtitle { font-size: 10px; color: #64748b; margin-top: 2px; }
  .card-badges { display: flex; gap: 4px; margin-top: 4px; }
  .card-desc { font-size: 11px; color: #94a3b8; margin-top: 4px; line-height: 1.4; }
  .result-steps { display: flex; flex-direction: column; gap: 6px; }
  .step-item { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 4px; }
  .step-item.running { background: #3b82f608; }
  .step-indicator { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; background: #1e293b; color: #64748b; flex-shrink: 0; }
  .step-indicator.done { background: #22c55e22; color: #22c55e; }
  .step-indicator.active { background: #3b82f622; color: #3b82f6; }
  .step-content { flex: 1; }
  .step-label { font-size: 11px; font-weight: 600; color: #e2e8f0; }
  .step-detail { font-size: 10px; color: #64748b; }
  .step-status { font-size: 10px; font-weight: 600; flex-shrink: 0; }
  .result-markdown { padding: 10px; font-size: 12px; line-height: 1.6; color: #94a3b8; }
  .result-markdown h3 { font-size: 14px; color: #e2e8f0; margin: 0 0 6px; }
  .result-markdown h4 { font-size: 12px; color: #e2e8f0; margin: 8px 0 4px; }
  .result-markdown .md-li { padding-left: 8px; margin: 2px 0; }
  ${ADVANCED_RENDERER_CSS}
`;
