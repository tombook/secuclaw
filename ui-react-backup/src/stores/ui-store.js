/**
 * SecuClaw UI Store — Zustand
 *
 * Manages UI state: theme, locale, sidebar, notifications, menu mode.
 * Migrated from Lit BaseStore pattern to Zustand with persist middleware.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
function applyTheme(theme) {
    let effective;
    if (theme === 'system') {
        effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    else {
        effective = theme;
    }
    document.documentElement.setAttribute('data-theme', effective);
}
export const useUIStore = create()(persist((set, get) => ({
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
    setTheme(theme) {
        set({ theme });
        applyTheme(theme);
    },
    setLocale(locale) {
        set({ locale });
    },
    toggleSidebar() {
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }));
    },
    setSidebarCollapsed(collapsed) {
        set({ sidebarCollapsed: collapsed });
    },
    setMenuMode(mode) {
        set({ menuMode: mode });
    },
    toggleMenuMode() {
        set((s) => ({ menuMode: s.menuMode === 'traditional' ? 'role-centric' : 'traditional' }));
    },
    showNotification(notification) {
        const id = crypto.randomUUID();
        const newNotification = { ...notification, id };
        set((s) => ({ notifications: [...s.notifications, newNotification] }));
        if (notification.duration !== 0) {
            setTimeout(() => get().dismissNotification(id), notification.duration ?? 5000);
        }
    },
    dismissNotification(id) {
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
    },
    setLoading(loading) {
        set({ loading });
    },
}), {
    name: 'secuclaw-ui',
    partialize: (state) => ({
        theme: state.theme,
        locale: state.locale,
        sidebarCollapsed: state.sidebarCollapsed,
        menuMode: state.menuMode,
    }),
}));
//# sourceMappingURL=ui-store.js.map