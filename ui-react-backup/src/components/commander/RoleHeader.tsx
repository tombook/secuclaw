import React from 'react';
import type { RoleTheme } from '@/config/role-themes';
import { ROLE_THEMES } from '@/config/role-themes';
import { useRoleContextStore } from '@/stores/role-context';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Download, Zap } from 'lucide-react';

export interface RoleHeaderProps {
  onBack?: () => void;
}

export const RoleHeader: React.FC<RoleHeaderProps> = ({ onBack }) => {
  const currentRole = useRoleContextStore((s) => s.currentRole);
  if (!currentRole) return null;

  const theme: RoleTheme = ROLE_THEMES[currentRole];

  return (
    <div className="relative pb-4 mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-start gap-5">
        {/* Emoji avatar */}
        <div
          className="flex items-center justify-center flex-shrink-0 text-3xl shadow-lg"
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: theme.colors.primary,
            boxShadow: `0 4px 20px ${theme.colors.primary}44`,
          }}
        >
          {theme.icon}
        </div>

        {/* Name + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: theme.colors.text }}
            >
              {theme.name}
            </h1>
            <span
              className="text-sm font-medium"
              style={{ color: theme.colors.textSecondary }}
            >
              {theme.nameCn}
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
            {theme.description}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white/60 hover:text-white hover:bg-white/5 gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            返回总览
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white hover:bg-white/5 gap-1.5"
          >
            <Download className="w-4 h-4" />
            导出报告
          </Button>
          <Button
            size="sm"
            className="gap-1.5 text-white text-xs"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Zap className="w-3.5 h-3.5" />
            快速操作
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoleHeader;
