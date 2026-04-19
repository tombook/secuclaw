import React from 'react';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES } from '@/config/role-themes';
import { getRoleLayoutConfig } from '@/config/role-layout-config';
import { RoleHeader } from './RoleHeader';
import { RaciTaskSection } from './RaciTaskSection';
import { RoleMetricsSection } from './RoleMetricsSection';
import { RoleCollaborationSection } from './RoleCollaborationSection';

export interface RoleCommanderProps {
  onBack?: () => void;
}

/**
 * Map layout type to CSS grid template.
 * We support 8 layout variants but use a unified responsive grid.
 */
function gridClass(layoutType: string): string {
  switch (layoutType) {
    case 'grid':
      return 'grid grid-cols-3 gap-4';
    case 'card-flow':
      return 'grid grid-cols-2 gap-4';
    case 'three-column':
      return 'grid grid-cols-3 gap-4';
    case 'timeline':
      return 'flex flex-col gap-4';
    case 'war-room':
      return 'grid grid-cols-2 gap-4';
    case 'dashboard':
      return 'grid grid-cols-3 gap-4';
    case 'queue':
      return 'flex flex-col gap-4';
    case 'graph':
      return 'grid grid-cols-2 gap-4';
    default:
      return 'grid grid-cols-3 gap-4';
  }
}

/**
 * Map section size to span class.
 */
function spanClass(size: string): string {
  switch (size) {
    case 'full':
      return 'col-span-full';
    case 'large':
      return 'col-span-2';
    case 'medium':
      return 'col-span-1';
    case 'small':
      return 'col-span-1';
    default:
      return 'col-span-1';
  }
}

export const RoleCommander: React.FC<RoleCommanderProps> = ({ onBack }) => {
  const currentRole = useRoleContextStore((s) => s.currentRole);
  const resetToOverview = useRoleContextStore((s) => s.resetToOverview);

  if (!currentRole) return null;

  const theme = ROLE_THEMES[currentRole];
  const layoutConfig = getRoleLayoutConfig(currentRole);

  const handleBack = () => {
    resetToOverview();
    onBack?.();
  };

  // Build section renderers based on type
  const sectionRenderer = (type: string) => {
    switch (type) {
      case 'raci':
        return <RaciTaskSection />;
      case 'metrics':
        return <RoleMetricsSection />;
      case 'collaboration':
        return <RoleCollaborationSection />;
      case 'custom':
        return (
          <div
            className="rounded-lg p-4 flex items-center justify-center text-xs text-white/30"
            style={{ backgroundColor: '#0f1525', minHeight: 120 }}
          >
            [自定义组件区域]
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        '--role-primary': theme.colors.primary,
        '--role-secondary': theme.colors.secondary,
        '--role-accent': theme.colors.accent,
        '--role-text': theme.colors.text,
        '--role-text-secondary': theme.colors.textSecondary,
      } as React.CSSProperties}
    >
      {/* Header */}
      <RoleHeader onBack={handleBack} />

      {/* Content — dynamic grid */}
      <div className={gridClass(layoutConfig.layoutType)}>
        {layoutConfig.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <div key={section.id} className={spanClass(section.size)}>
              <div
                className="rounded-lg p-4 transition-all duration-200 hover:brightness-105"
                style={{ backgroundColor: '#0f1525' }}
              >
                <h4
                  className="text-xs font-semibold mb-3 uppercase tracking-wide"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {section.title}
                </h4>
                {sectionRenderer(section.type)}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default RoleCommander;
