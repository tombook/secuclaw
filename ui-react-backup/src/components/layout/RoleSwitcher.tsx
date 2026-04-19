/**
 * SecuClaw RoleSwitcher
 *
 * Dropdown panel showing 8 role cards. Clicking a card switches the entire
 * UI color scheme via the Zustand role-context store.
 *
 * Uses shadcn/ui DropdownMenu (Popover is not available in this project).
 */

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES, ALL_ROLE_IDS } from '@/config/role-themes';
import type { RoleId } from '@/config/role-themes';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const RoleSwitcher: React.FC = () => {
  const currentRole = useRoleContextStore((s) => s.currentRole);
  const setRole = useRoleContextStore((s) => s.setRole);
  const theme = currentRole ? ROLE_THEMES[currentRole] : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-1.5',
            'text-sm font-medium transition-all duration-300',
            'hover:bg-white/10 focus:outline-none focus:ring-1',
            'border border-white/10'
          )}
          style={{
            color: theme?.colors.text ?? '#f1f5f9',
          }}
        >
          <span className="text-base">{theme?.icon ?? '🛡️'}</span>
          <span className="hidden sm:inline max-w-[120px] truncate">
            {theme?.nameCn ?? '选择角色'}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="center"
        className="w-[420px] max-h-[460px] overflow-y-auto rounded-xl border border-white/10 bg-[#0f1525] p-2 shadow-2xl"
      >
        <div className="px-2 py-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
          切换安全角色
        </div>
        <div className="grid grid-cols-1 gap-1 mt-1">
          {ALL_ROLE_IDS.map((roleId: RoleId) => {
            const r = ROLE_THEMES[roleId];
            const isActive = currentRole === roleId;
            return (
              <DropdownMenuItem
                key={roleId}
                className={cn(
                  'relative flex items-start gap-3 rounded-lg px-3 py-2.5 cursor-pointer',
                  'transition-all duration-200 hover:bg-white/5 focus:bg-white/5',
                  isActive && 'bg-white/10'
                )}
                onSelect={(e) => {
                  e.preventDefault();
                  setRole(roleId);
                }}
              >
                {/* Color accent bar */}
                <div
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full transition-all duration-300"
                  style={{ backgroundColor: r.colors.primary }}
                />
                <span className="text-xl mt-0.5 ml-2">{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100">
                      {r.nameCn}
                    </span>
                    <span className="text-[10px] text-slate-500">{r.name}</span>
                    {isActive && (
                      <span
                        className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: r.colors.primary + '40',
                          color: r.colors.secondary,
                        }}
                      >
                        当前
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {r.description}
                  </p>
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RoleSwitcher;
