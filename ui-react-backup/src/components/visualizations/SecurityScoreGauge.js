import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
function scoreColor(score) {
    if (score < 60)
        return '#ef4444';
    if (score < 80)
        return '#eab308';
    return '#22c55e';
}
export const SecurityScoreGauge = ({ score, label = '安全评分', size = 160, className = '', }) => {
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.max(0, Math.min(100, score));
    const offset = circumference - (progress / 100) * circumference;
    const color = scoreColor(score);
    return (_jsxs("div", { className: `flex flex-col items-center gap-2 ${className}`, children: [_jsxs("svg", { width: size, height: size, className: "-rotate-90", children: [_jsx("circle", { cx: size / 2, cy: size / 2, r: radius, fill: "none", stroke: "rgba(255,255,255,0.08)", strokeWidth: strokeWidth }), _jsx("circle", { cx: size / 2, cy: size / 2, r: radius, fill: "none", stroke: color, strokeWidth: strokeWidth, strokeLinecap: "round", strokeDasharray: circumference, strokeDashoffset: offset, className: "transition-[stroke-dashoffset] duration-700 ease-out" })] }), _jsx("div", { className: "absolute flex flex-col items-center justify-center pointer-events-none", style: { width: size, height: size }, children: _jsx("span", { className: "text-3xl font-bold", style: { color }, children: Math.round(score) }) }), _jsx("span", { className: "text-xs font-medium", style: { color: 'var(--role-text-secondary, #94a3b8)' }, children: label })] }));
};
export default SecurityScoreGauge;
//# sourceMappingURL=SecurityScoreGauge.js.map