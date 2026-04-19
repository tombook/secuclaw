/**
 * 高级渲染器 CSS — chart/timeline/json-tree 样式
 * 注入到 plugin-runtime 的 PLUGIN_PANEL_CSS 中
 */

export const ADVANCED_RENDERER_CSS = `
  /* Chart */
  .chart-wrap { padding: 8px 0; }
  .result-chart { max-width: 100%; }
  .chart-legend { display: flex; flex-direction: column; gap: 4px; min-width: 120px; }
  .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; }
  .legend-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
  .legend-label { color: #94a3b8; flex: 1; }
  .legend-value { color: #e2e8f0; font-weight: 600; font-size: 10px; }

  /* Timeline */
  .result-timeline { display: flex; flex-direction: column; gap: 0; }
  .tl-item { display: flex; gap: 12px; min-height: 48px; }
  .tl-line { display: flex; flex-direction: column; align-items: center; width: 20px; flex-shrink: 0; }
  .tl-dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid #0f172a; flex-shrink: 0; margin-top: 4px; }
  .tl-connector { width: 2px; flex: 1; background: #1e293b; margin: 2px 0; }
  .tl-content { flex: 1; padding-bottom: 14px; }
  .tl-time { font-size: 10px; color: #475569; }
  .tl-title { font-size: 12px; font-weight: 600; color: #e2e8f0; margin: 1px 0; }
  .tl-desc { font-size: 11px; color: #94a3b8; line-height: 1.4; }

  /* JSON Tree */
  .result-json-tree { font-family: 'SF Mono', 'Monaco', 'Menlo', monospace; font-size: 11px; line-height: 1.6; padding: 8px; background: #0a0f1a; border-radius: 4px; overflow-x: auto; }
  .jt-key { color: #60a5fa; }
  .jt-str { color: #a5f3a3; }
  .jt-num { color: #fbbf24; }
  .jt-bool { color: #c084fc; }
  .jt-null { color: #64748b; font-style: italic; }
  .jt-bracket { color: #94a3b8; font-weight: 700; }
  .jt-comma { color: #475569; }
  .jt-more { color: #475569; font-style: italic; font-size: 10px; }
`;
