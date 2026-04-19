import React from 'react';

export interface SparkLineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
}

export const SparkLine: React.FC<SparkLineProps> = ({
  data,
  color = 'var(--role-secondary, #3b82f6)',
  width = 80,
  height = 28,
  strokeWidth = 1.5,
  className = '',
}) => {
  if (!data || data.length < 2) return null;

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

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible ${className}`}
    >
      {/* gradient fill */}
      <defs>
        <linearGradient id={`spark-grad-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-grad-${color.replace(/[^a-zA-Z0-9]/g, '')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default SparkLine;
