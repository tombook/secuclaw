/**
 * SecuClaw AppHeader
 *
 * Top bar: page title / breadcrumbs (left), role switcher (center),
 * notification bell + AI assistant + settings (right).
 * Height 56 px, semi-transparent with bottom glow border.
 */

import React from 'react';
import { Bell, Bot, Settings, Menu } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES } from '@/config/role-themes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RoleSwitcher } from './RoleSwitcher';
import { cn } from '@/lib/utils';

export const AppHeader: React.FC = () => {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const notifications = useUIStore((s) => s.notifications);
  const currentRole = useRoleContextStore((s) => s.currentRole);
  const theme = currentRole ? ROLE_THEMES[currentRole] : null;

  const unreadCount = notifications.length;

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center justify-between px-4',
        'bg-[#0f1525]/80 backdrop-blur-xl',
        'border-b transition-colors duration-500'
      )}
      style={{
        borderBottomColor: theme
          ? `${theme.colors.primary}40`
          : 'rgba(255,255,255,0.06)',
        boxShadow: theme
          ? `0 1px 8px ${theme.colors.primary}20`
          : 'none',
      }}
    >
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-slate-400 hover:text-slate-200 hover:bg-white/5 md:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm font-semibold text-slate-200 truncate">
            {theme?.nameCn ?? 'SecuClaw'}
          </h1>
          {theme && (
            <span className="hidden sm:inline text-xs text-slate-500 truncate">
              / {theme.description}
            </span>
          )}
        </div>
      </div>

      {/* Center: role switcher */}
      <div className="hidden md:flex">
        <RoleSwitcher />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-400 hover:text-slate-200 hover:bg-white/5"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 text-[10px] font-bold flex items-center justify-center rounded-full"
              style={{
                backgroundColor: theme?.colors.accent ?? '#ef4444',
                color: '#fff',
                border: 'none',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>

        {/* AI assistant */}
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-slate-200 hover:bg-white/5"
          style={{
            color: theme?.colors.secondary,
          }}
        >
          <Bot className="h-[18px] w-[18px]" />
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-slate-200 hover:bg-white/5"
        >
          <Settings className="h-[18px] w-[18px]" />
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;
