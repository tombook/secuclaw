/**
 * Plugin Manifest 校验器
 * 验证 ToolPluginManifest 结构完整性
 */

import type { ToolPluginManifest, FormFieldDef, ResultDisplayDef } from '../types';

export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * 校验 manifest 完整性
 */
export function validateManifest(m: Partial<ToolPluginManifest>): ValidationError[] {
  const errors: ValidationError[] = [];

  // ─── Meta ───
  if (!m.meta) {
    errors.push({ path: 'meta', message: '缺少 meta 字段', severity: 'error' });
  } else {
    _require(m.meta, 'meta.id', errors);
    _require(m.meta, 'meta.name', errors);
    _require(m.meta, 'meta.version', errors);
    _require(m.meta, 'meta.category', errors);
    _require(m.meta, 'meta.provider', errors);
    _require(m.meta, 'meta.description', errors);
  }

  // ─── UI ───
  if (!m.ui) {
    errors.push({ path: 'ui', message: '缺少 ui 字段', severity: 'error' });
  } else {
    _require(m.ui, 'ui.panelMode', errors);
    if (!m.ui.form || m.ui.form.length === 0) {
      errors.push({ path: 'ui.form', message: '表单至少需要一个字段', severity: 'warning' });
    } else {
      m.ui.form.forEach((f, i) => {
        _require(f, `ui.form[${i}].name`, errors);
        _require(f, `ui.form[${i}].label`, errors);
        _require(f, `ui.form[${i}].type`, errors);
        // Validate options for select/multiselect
        if ((f.type === 'select' || f.type === 'multiselect') && (!f.options || f.options.length === 0) && !f.optionsEndpoint) {
          errors.push({ path: `ui.form[${i}].options`, message: `${f.type} 类型需要 options 或 optionsEndpoint`, severity: 'error' });
        }
      });
    }
    if (!m.ui.result) {
      errors.push({ path: 'ui.result', message: '缺少 result 配置', severity: 'error' });
    } else {
      _require(m.ui.result, 'ui.result.type', errors);
      _validateResultDef(m.ui.result, 'ui.result', errors);
    }
  }

  // ─── API ───
  if (!m.api) {
    errors.push({ path: 'api', message: '缺少 api 字段', severity: 'error' });
  } else {
    _require(m.api, 'api.endpoint', errors);
    _require(m.api, 'api.method', errors);
    _require(m.api, 'api.adapter', errors);
    _require(m.api, 'api.auth', errors);
  }

  // ─── Schema ───
  if (!m.schema) {
    errors.push({ path: 'schema', message: '缺少 schema 字段', severity: 'warning' });
  }

  // ─── Bindings ───
  if (!m.bindings) {
    errors.push({ path: 'bindings', message: '缺少 bindings 字段', severity: 'error' });
  } else {
    if (!m.bindings.roles || m.bindings.roles.length === 0) {
      errors.push({ path: 'bindings.roles', message: '至少绑定一个角色', severity: 'warning' });
    }
  }

  return errors;
}

function _require(obj: Record<string, unknown>, path: string, errors: ValidationError[]): void {
  const parts = path.split('.');
  const field = parts[parts.length - 1];
  if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
    errors.push({ path, message: `缺少必填字段: ${field}`, severity: 'error' });
  }
}

function _validateResultDef(def: ResultDisplayDef, path: string, errors: ValidationError[]): void {
  switch (def.type) {
    case 'table':
      if (!def.columns || def.columns.length === 0) {
        errors.push({ path: `${path}.columns`, message: 'table 类型需要 columns 配置', severity: 'error' });
      }
      break;
    case 'cards':
      if (!def.cardFields?.title) {
        errors.push({ path: `${path}.cardFields.title`, message: 'cards 类型需要 cardFields.title', severity: 'error' });
      }
      break;
    case 'chart':
    case 'radar':
      if (!def.chartConfig) {
        errors.push({ path: `${path}.chartConfig`, message: 'chart/radar 类型需要 chartConfig', severity: 'error' });
      }
      break;
    case 'progress-steps':
      if (!def.steps || def.steps.length === 0) {
        errors.push({ path: `${path}.steps`, message: 'progress-steps 类型需要 steps 配置', severity: 'warning' });
      }
      break;
  }
}
