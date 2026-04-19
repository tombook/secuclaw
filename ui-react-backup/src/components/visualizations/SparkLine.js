import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export const SparkLine = ({ data, color = 'var(--role-secondary, #3b82f6)', width = 80, height = 28, strokeWidth = 1.5, className = '', }) => {
    if (!data || data.length < 2)
        return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - strokeWidth * 2) - strokeWidth;
        return `${x},${y}`;
    });
    const pathD = `M${points.join(' L')}`;
    // Fill area
    const areaD = `${pathD} L${width},${height} L0,${height} Z`;
    return (_jsxs("svg", { width: width, height: height, viewBox: `0 0 ${width} ${height}`, className: `overflow-visible ${className}`, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: `spark-grad-${color.replace(/[^a-zA-Z0-9]/g, '')}`, x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: color, stopOpacity: 0.3 }), _jsx("stop", { offset: "100%", stopColor: color, stopOpacity: 0 })] }) }), _jsx("path", { d: areaD, fill: `url(#spark-grad-${color.replace(/[^a-zA-Z0-9]/g, '')})` }), _jsx("path", { d: pathD, fill: "none", stroke: color, strokeWidth: strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" })] }));
};
export default SparkLine;
//# sourceMappingURL=SparkLine.js.map