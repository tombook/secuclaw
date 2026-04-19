import React from 'react';

export interface RadarDataPoint {
  dimension: string;
  value: number; // 0-100
}

export interface ExpertiseRadarProps {
  data: RadarDataPoint[];
  fillColor?: string;
  strokeColor?: string;
  size?: number;
  className?: string;
}

export const ExpertiseRadar: React.FC<ExpertiseRadarProps> = ({
  data,
  fillColor = 'var(--role-primary, #1e40af)',
  strokeColor = 'var(--role-secondary, #3b82f6)',
  size = 240,
  className = '',
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 40;
  const levels = 4;

  if (!data || data.length < 3) return null;

  const angleStep = (2 * Math.PI) / data.length;

  // Compute point positions
  const points = data.map((d, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const r = (d.value / 100) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      labelAngle: angle,
      ...d,
    };
  });

  // Grid ring helper
  const ringPoint = (level: number, idx: number) => {
    const angle = -Math.PI / 2 + idx * angleStep;
    const r = (level / levels) * radius;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const dataPath = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className={className}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid rings */}
        {Array.from({ length: levels }).map((_, lvl) => {
          const ringPts = data.map((_, idx) => {
            const p = ringPoint(lvl + 1, idx);
            return `${p.x},${p.y}`;
          });
          return (
            <polygon
              key={lvl}
              points={ringPts.join(' ')}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
          );
        })}

        {/* Axis lines */}
        {data.map((_, idx) => {
          const p = ringPoint(levels, idx);
          return (
            <line key={idx} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={dataPath}
          fill={fillColor}
          fillOpacity={0.25}
          stroke={strokeColor}
          strokeWidth={2}
        />

        {/* Data dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={strokeColor} />
        ))}

        {/* Labels */}
        {points.map((p, i) => {
          const labelR = radius + 22;
          const lx = cx + labelR * Math.cos(p.labelAngle);
          const ly = cy + labelR * Math.sin(p.labelAngle);
          const textAnchor = Math.abs(Math.cos(p.labelAngle)) < 0.1 ? 'middle' : Math.cos(p.labelAngle) > 0 ? 'start' : 'end';
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor={textAnchor}
              dominantBaseline="central"
              fill="var(--role-text-secondary, #94a3b8)"
              fontSize={10}
              fontWeight={500}
            >
              {p.dimension}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default ExpertiseRadar;
