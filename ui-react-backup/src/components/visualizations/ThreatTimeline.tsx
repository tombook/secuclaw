import React, { useState } from 'react';

/* ── Types ── */
export interface ThreatEvent {
  time: string;     // e.g. "09:15"
  label: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ThreatTimelineProps {
  events: ThreatEvent[];
  accentColor?: string;
  compact?: boolean;
  className?: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
};

const Y_VALUES: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const ThreatTimeline: React.FC<ThreatTimelineProps> = ({
  events,
  accentColor = 'var(--role-secondary, #3b82f6)',
  compact = false,
  className = '',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 700;
  const height = 120;
  const padX = 40;
  const padY = 16;

  if (!events || events.length === 0) {
    return (
      <div className={`flex items-center justify-center h-[120px] text-xs text-white/40 ${className}`}>
        暂无威胁事件
      </div>
    );
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

  return (
    <div className={`relative ${className}`}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id="threat-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Y-axis labels */}
        {['critical', 'high', 'medium', 'low'].map((sev) => {
          const y = padY + innerH - (Y_VALUES[sev] / 4) * innerH;
          return (
            <g key={sev}>
              <line x1={padX} x2={width - padX} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" />
              <text x={4} y={y + 3} fill="rgba(255,255,255,0.3)" fontSize={9}>
                {sev === 'critical' ? '严重' : sev === 'high' ? '高' : sev === 'medium' ? '中' : '低'}
              </text>
            </g>
          );
        })}

        {/* area fill */}
        <path d={areaPath} fill="url(#threat-area-grad)" />
        {/* line */}
        <path d={linePath} fill="none" stroke={accentColor} strokeWidth={2} strokeLinejoin="round" />

        {/* dots */}
        {points.map((p, i) => (
          <g
            key={i}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="cursor-pointer"
          >
            <circle cx={p.x} cy={p.y} r={hoveredIdx === i ? 6 : 4} fill={SEVERITY_COLORS[p.severity]} className="transition-all duration-150" />
          </g>
        ))}
      </svg>

      {/* Custom tooltip */}
      {hoveredIdx !== null && (
        <div
          className="absolute top-0 bg-[#0f1525] border border-white/10 rounded-lg px-3 py-2 text-xs pointer-events-none z-10 shadow-lg"
          style={{ left: `${(points[hoveredIdx].x / width) * 100}%`, transform: 'translateX(-50%)' }}
        >
          <div className="font-semibold text-white">{points[hoveredIdx].label}</div>
          <div className="text-white/50">
            {points[hoveredIdx].time} ·
            <span style={{ color: SEVERITY_COLORS[points[hoveredIdx].severity] }}>
              {' '}{points[hoveredIdx].severity.toUpperCase()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreatTimeline;
