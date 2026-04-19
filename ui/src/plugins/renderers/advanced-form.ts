/**
 * 高级表单渲染器
 * - dependsOn 条件字段
 * - date / daterange / checkbox / code-editor 字段类型
 * - 动态选项加载 (optionsEndpoint)
 */

import { html, nothing, type TemplateResult } from 'lit';
import type { FormFieldDef } from '../types';

/**
 * 判断字段是否应该显示（dependsOn 条件）
 */
export function shouldShowField(
  field: FormFieldDef,
  formValues: Record<string, unknown>,
): boolean {
  if (!field.dependsOn) return true;
  const parentValue = formValues[field.dependsOn.field];
  return parentValue === field.dependsOn.value;
}

/**
 * 过滤出当前应该显示的字段列表
 */
export function filterVisibleFields(
  fields: FormFieldDef[],
  formValues: Record<string, unknown>,
): FormFieldDef[] {
  return fields.filter(f => shouldShowField(f, formValues));
}

/**
 * 动态加载选项（从 optionsEndpoint）
 * 当前返回空数组，等后端就绪后实现 fetch 逻辑
 */
export async function loadDynamicOptions(
  field: FormFieldDef,
): Promise<Array<{ value: string; label: string }>> {
  if (!field.optionsEndpoint) return field.options ?? [];

  // TODO: fetch from endpoint when backend is ready
  // const resp = await fetch(field.optionsEndpoint);
  // return resp.json();
  return field.options ?? [];
}

/**
 * 高级字段渲染器（date/daterange/checkbox/code-editor）
 * 被 plugin-runtime 的 renderField 调用
 */
export function renderAdvancedField(
  f: FormFieldDef,
  values: Record<string, unknown>,
  onInput: (name: string, value: unknown) => void,
  theme: { primary: string },
): TemplateResult | null {
  const val = values[f.name] ?? f.defaultValue ?? '';

  const label = html`<label class="field-label">${f.required ? html`<span class="req">*</span>` : nothing}${f.label}</label>`;

  switch (f.type) {
    case 'date':
      return html`<div class="field">${label}<input type="date" class="field-input" .value=${val as string} @input=${(e: Event) => onInput(f.name, (e.target as HTMLInputElement).value)} /></div>`;

    case 'daterange': {
      const rangeVal = val as { start?: string; end?: string } ?? {};
      return html`<div class="field">${label}<div style="display:flex;gap:6px">
        <input type="date" class="field-input" style="flex:1" .value=${rangeVal.start ?? ''} @input=${(e: Event) => onInput(f.name, { ...rangeVal, start: (e.target as HTMLInputElement).value })} />
        <span style="color:#475569;font-size:11px;line-height:32px">→</span>
        <input type="date" class="field-input" style="flex:1" .value=${rangeVal.end ?? ''} @input=${(e: Event) => onInput(f.name, { ...rangeVal, end: (e.target as HTMLInputElement).value })} />
      </div></div>`;
    }

    case 'checkbox':
      return html`<div class="field" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" ?checked=${val as boolean} @change=${(e: Event) => onInput(f.name, (e.target as HTMLInputElement).checked)} style="accent-color:${theme.primary}" />${label}</div>`;

    case 'code-editor':
      return html`<div class="field">${label}<textarea class="field-textarea" style="font-family:'SF Mono','Monaco','Menlo',monospace;font-size:11px;min-height:80px;background:#060a12;border-color:#1e293b" placeholder=${f.placeholder ?? ''} .value=${val as string} @input=${(e: Event) => onInput(f.name, (e.target as HTMLTextAreaElement).value)}></textarea></div>`;

    default:
      return null; // Not an advanced field — let runtime handle it
  }
}
