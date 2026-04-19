import React from 'react';
export interface RadarDataPoint {
    dimension: string;
    value: number;
}
export interface ExpertiseRadarProps {
    data: RadarDataPoint[];
    fillColor?: string;
    strokeColor?: string;
    size?: number;
    className?: string;
}
export declare const ExpertiseRadar: React.FC<ExpertiseRadarProps>;
export default ExpertiseRadar;
//# sourceMappingURL=ExpertiseRadar.d.ts.map