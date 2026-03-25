import { BaseStore } from './base-store.js';

interface UIState {
  theme: 'light' | 'dark' | 'system';
  locale: 'zh-CN' | 'en' | 'zh-TW';
  sidebarCollapsed: boolean;
  loading: boolean;
  notifications: Notification[];
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
}

class UIStore extends BaseStore<UIState> {
  constructor() {
    super({
      theme: (localStorage.getItem('secuclaw-theme') as UIState['theme']) || 'dark',
      locale: (localStorage.getItem('secuclaw-locale') as UIState['locale']) || 'zh-CN',
      sidebarCollapsed: localStorage.getItem('secuclaw-sidebar-collapsed') === 'true',
      loading: false,
      notifications: [],
    });
  }

  async initialize(): Promise<void> {
    this.applyTheme();
  }

  setTheme(theme: UIState['theme']): void {
    this.setState({ theme });
    localStorage.setItem('secuclaw-theme', theme);
    this.applyTheme();
  }

  private applyTheme(): void {
    const { theme } = this.state;
    let effectiveTheme = theme;
    
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }

  setLocale(locale: UIState['locale']): void {
    this.setState({ locale });
    localStorage.setItem('secuclaw-locale', locale);
  }

  toggleSidebar(): void {
    const collapsed = !this.state.sidebarCollapsed;
    this.setState({ sidebarCollapsed: collapsed });
    localStorage.setItem('secuclaw-sidebar-collapsed', String(collapsed));
  }

  showNotification(notification: Omit<Notification, 'id'>): void {
    const id = crypto.randomUUID();
    const newNotification = { ...notification, id };
    this.setState({
      notifications: [...this.state.notifications, newNotification],
    });

    if (notification.duration !== 0) {
      setTimeout(() => this.dismissNotification(id), notification.duration || 5000);
    }
  }

  dismissNotification(id: string): void {
    this.setState({
      notifications: this.state.notifications.filter((n) => n.id !== id),
    });
  }

  setLoading(loading: boolean): void {
    this.setState({ loading });
  }
}

export const uiStore = new UIStore();
export type { Notification };
