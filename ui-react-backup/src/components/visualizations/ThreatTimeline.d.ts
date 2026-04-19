import React from 'react';
export interface ThreatEvent {
    time: string;
    label: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
}
export interface ThreatTimelineProps {
    events: ThreatEvent[];
    accentColor?: string;
    compact?: boolean;
    className?: string;
}
export declare const ThreatTimeline: React.FC<ThreatTimelineProps>;
export default ThreatTimeline;
//# sourceMappingURL=ThreatTimeline.d.ts.map