import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
const SEVERITY_COLORS = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#3b82f6',
};
const Y_VALUES = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
};
export const ThreatTimeline = ({ events, accentColor = 'var(--role-secondary, #3b82f6)', compact = false, className = '', }) => {
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const width = 700;
    const height = 120;
    const padX = 40;
    const padY = 16;
    if (!events || events.length === 0) {
        return (_jsx("div", { className: `flex items-center justify-center h-[120px] text-xs text-white/40 ${className}`, children: "\u6682\u65E0\u5A01\u80C1\u4E8B\u4EF6" }));
    }
    const innerW = width - padX * 2;
    const innerH = height - padY * 2;
    // spread events evenly
    const xStep = events.length > 1 ? innerW / (events.length - 1) : innerW / 2;
    const points = events.map((e, i) => ({
        x: padX + i * xStep,
        y: padY + innerH - (Y_VALUES[e.severity] / 4) * innerH,
        ...e,
    }));
    // build area path
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const areaPath = `${linePath} L${points[points.length - 1].x},${height - padY} L${points[0].x},${height - padY} Z`;
    return (_jsxs("div", { className: `relative ${className}`, children: [_jsxs("svg", { width: "100%", viewBox: `0 0 ${width} ${height}`, className: "overflow-visible", children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "threat-area-grad", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: accentColor, stopOpacity: 0.3 }), _jsx("stop", { offset: "100%", stopColor: accentColor, stopOpacity: 0 })] }) }), ['critical', 'high', 'medium', 'low'].map((sev) => {
                        const y = padY + innerH - (Y_VALUES[sev] / 4) * innerH;
                        return (_jsxs("g", { children: [_jsx("line", { x1: padX, x2: width - padX, y1: y, y2: y, stroke: "rgba(255,255,255,0.06)" }), _jsx("text", { x: 4, y: y + 3, fill: "rgba(255,255,255,0.3)", fontSize: 9, children: sev === 'critical' ? '严重' : sev === 'high' ? '高' : sev === 'medium' ? '中' : '低' })] }, sev));
                    }), _jsx("path", { d: areaPath, fill: "url(#threat-area-grad)" }), _jsx("path", { d: linePath, fill: "none", stroke: accentColor, strokeWidth: 2, strokeLinejoin: "round" }), points.map((p, i) => (_jsx("g", { onMouseEnter: () => setHoveredIdx(i), onMouseLeave: () => setHoveredIdx(null), className: "cursor-pointer", children: _jsx("circle", { cx: p.x, cy: p.y, r: hoveredIdx === i ? 6 : 4, fill: SEVERITY_COLORS[p.severity], className: "transition-all duration-150" }) }, i)))] }), hoveredIdx !== null && (_jsxs("div", { className: "absolute top-0 bg-[#0f1525] border border-white/10 rounded-lg px-3 py-2 text-xs pointer-events-none z-10 shadow-lg", style: { left: `${(points[hoveredIdx].x / width) * 100}%`, transform: 'translateX(-50%)' }, children: [_jsx("div", { className: "font-semibold text-white", children: points[hoveredIdx].label }), _jsxs("div", { className: "text-white/50", children: [points[hoveredIdx].time, " \u00B7", _jsxs("span", { style: { color: SEVERITY_COLORS[points[hoveredIdx].severity] }, children: [' ', points[hoveredIdx].severity.toUpperCase()] })] })] }))] }));
};
export default ThreatTimeline;
//# sourceMappingURL=ThreatTimeline.js.map