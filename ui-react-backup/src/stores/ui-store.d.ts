/**
 * SecuClaw UI Store — Zustand
 *
 * Manages UI state: theme, locale, sidebar, notifications, menu mode.
 * Migrated from Lit BaseStore pattern to Zustand with persist middleware.
 */
export type MenuMode = 'traditional' | 'role-centric';
export type ThemeMode = 'light' | 'dark' | 'system';
export type LocaleCode = 'zh-CN' | 'en' | 'zh-TW';
export interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    duration?: number;
}
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
export declare const useUIStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<UIStore>, "setState" | "persist"> & {
    setState(partial: UIStore | Partial<UIStore> | ((state: UIStore) => UIStore | Partial<UIStore>), replace?: false | undefined): unknown;
    setState(state: UIStore | ((state: UIStore) => UIStore), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<UIStore, {
            theme: ThemeMode;
            locale: LocaleCode;
            sidebarCollapsed: boolean;
            menuMode: MenuMode;
        }, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: UIStore) => void) => () => void;
        onFinishHydration: (fn: (state: UIStore) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<UIStore, {
            theme: ThemeMode;
            locale: LocaleCode;
            sidebarCollapsed: boolean;
            menuMode: MenuMode;
        }, unknown>>;
    };
}>;
export {};
//# sourceMappingURL=ui-store.d.ts.map