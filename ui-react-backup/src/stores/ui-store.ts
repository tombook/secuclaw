/**
 * SecuClaw UI Store — Zustand
 *
 * Manages UI state: theme, locale, sidebar, notifications, menu mode.
 * Migrated from Lit BaseStore pattern to Zustand with persist middleware.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ──

export type MenuMode = 'traditional' | 'role-centric';
export type ThemeMode = 'light' | 'dark' | 'system';
export type LocaleCode = 'zh-CN' | 'en' | 'zh-TW';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
}

// ── State & Actions ──

interface UIState {
  theme: ThemeMode;
  locale: LocaleCode;
  sidebarCollapsed: boolean;
  menuMode: MenuMode;
  loading: boolean;
  notifications: Notification[];
}

interface UIActions {
  initialize: () => void;
  setTheme: (theme: ThemeMode) => void;
  setLocale: (locale: LocaleCode) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMenuMode: (mode: MenuMode) => void;
  toggleMenuMode: () => void;
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export type UIStore = UIState & UIActions;

function applyTheme(theme: ThemeMode) {
  let effective: 'dark' | 'light';
  if (theme === 'system') {
    effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    effective = theme;
  }
  document.documentElement.setAttribute('data-theme', effective);
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // State
      theme: 'dark',
      locale: 'zh-CN',
      sidebarCollapsed: false,
      menuMode: 'role-centric',
      loading: false,
      notifications: [],

      // Actions
      initialize() {
        applyTheme(get().theme);
      },

      setTheme(theme: ThemeMode) {
        set({ theme });
        applyTheme(theme);
      },

      setLocale(locale: LocaleCode) {
        set({ locale });
      },

      toggleSidebar() {
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }));
      },

      setSidebarCollapsed(collapsed: boolean) {
        set({ sidebarCollapsed: collapsed });
      },

      setMenuMode(mode: MenuMode) {
        set({ menuMode: mode });
      },

      toggleMenuMode() {
        set((s) => ({ menuMode: s.menuMode === 'traditional' ? 'role-centric' : 'traditional' }));
      },

      showNotification(notification: Omit<Notification, 'id'>) {
        const id = crypto.randomUUID();
        const newNotification: Notification = { ...notification, id };
        set((s) => ({ notifications: [...s.notifications, newNotification] }));

        if (notification.duration !== 0) {
          setTimeout(() => get().dismissNotification(id), notification.duration ?? 5000);
        }
      },

      dismissNotification(id: string) {
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
      },

      setLoading(loading: boolean) {
        set({ loading });
      },
    }),
    {
      name: 'secuclaw-ui',
      partialize: (state) => ({
        theme: state.theme,
        locale: state.locale,
        sidebarCollapsed: state.sidebarCollapsed,
        menuMode: state.menuMode,
      }),
    }
  )
);
