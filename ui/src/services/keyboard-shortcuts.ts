/**
 * SecuClaw Keyboard Navigation Service
 * Comprehensive keyboard shortcuts for security operations workflow
 */

export interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  description: string;
  category: 'navigation' | 'actions' | 'search' | 'incident' | 'simulation';
  action: string;
}

export interface KeyboardShortcutHandler {
  (action: { type: string; [key: string]: unknown }): void;
}

const SHORTCUTS: KeyboardShortcut[] = [
  // Navigation
  { key: '1', modifiers: ['alt'], description: 'Go to Overview', category: 'navigation', action: 'navigate-overview' },
  { key: '2', modifiers: ['alt'], description: 'Go to Dashboard', category: 'navigation', action: 'navigate-dashboard' },
  { key: '3', modifiers: ['alt'], description: 'Go to Incidents', category: 'navigation', action: 'navigate-incidents' },
  { key: '4', modifiers: ['alt'], description: 'Go to Simulations', category: 'navigation', action: 'navigate-simulations' },
  { key: '5', modifiers: ['alt'], description: 'Go to Reports', category: 'navigation', action: 'navigate-reports' },
  { key: 'Escape', description: 'Close modal/panel', category: 'navigation', action: 'close-modal' },
  { key: 'ArrowLeft', modifiers: ['alt'], description: 'Previous panel', category: 'navigation', action: 'panel-prev' },
  { key: 'ArrowRight', modifiers: ['alt'], description: 'Next panel', category: 'navigation', action: 'panel-next' },
  
  // Search & Command Palette
  { key: 'k', modifiers: ['ctrl'], description: 'Open command palette', category: 'search', action: 'open-command-palette' },
  { key: 'p', modifiers: ['ctrl'], description: 'Quick search', category: 'search', action: 'quick-search' },
  
  // Actions
  { key: 's', modifiers: ['ctrl'], description: 'Save current state', category: 'actions', action: 'save' },
  { key: 'e', modifiers: ['ctrl'], description: 'Export data', category: 'actions', action: 'export' },
  { key: 'r', modifiers: ['ctrl'], description: 'Refresh data', category: 'actions', action: 'refresh' },
  { key: 'n', modifiers: ['ctrl'], description: 'New incident', category: 'actions', action: 'new-incident' },
  { key: 'f', modifiers: ['ctrl'], description: 'Filter panel', category: 'actions', action: 'toggle-filter' },
  { key: 'd', modifiers: ['ctrl'], description: 'Toggle dark mode', category: 'actions', action: 'toggle-theme' },
  
  // Incident Response
  { key: 'i', modifiers: ['ctrl', 'shift'], description: 'Create incident', category: 'incident', action: 'create-incident' },
  { key: 'a', modifiers: ['ctrl', 'shift'], description: 'Assign incident', category: 'incident', action: 'assign-incident' },
  { key: 'c', modifiers: ['ctrl', 'shift'], description: 'Change incident status', category: 'incident', action: 'change-status' },
  { key: 'w', modifiers: ['ctrl'], description: 'Escalate to war room', category: 'incident', action: 'escalate-warroom' },
  
  // Simulations
  { key: 'Enter', modifiers: ['ctrl'], description: 'Start simulation', category: 'simulation', action: 'start-simulation' },
  { key: 'Enter', modifiers: ['ctrl', 'shift'], description: 'Pause simulation', category: 'simulation', action: 'pause-simulation' },
  { key: 't', modifiers: ['ctrl'], description: 'Toggle timeline view', category: 'simulation', action: 'toggle-timeline' },
];

export class KeyboardNavigationService {
  private handlers: Map<string, KeyboardShortcutHandler> = new Map();
  private enabled = true;
  private announcementElement: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      document.addEventListener('keydown', this.handleKeyDown.bind(this));
      this.createAriaLiveRegion();
    }
  }

  private createAriaLiveRegion() {
    this.announcementElement = document.createElement('div');
    this.announcementElement.setAttribute('role', 'status');
    this.announcementElement.setAttribute('aria-live', 'polite');
    this.announcementElement.setAttribute('aria-atomic', 'true');
    this.announcementElement.className = 'sr-only';
    this.announcementElement.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(this.announcementElement);
  }

  private announce(message: string) {
    if (this.announcementElement) {
      this.announcementElement.textContent = message;
      setTimeout(() => {
        if (this.announcementElement) {
          this.announcementElement.textContent = '';
        }
      }, 1000);
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (!this.enabled) return;

    // Don't capture if in input/textarea/select (except for global shortcuts)
    const target = event.target as HTMLElement;
    const isEditable = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.tagName === 'SELECT' ||
                       target.isContentEditable;
    
    // Allow navigation shortcuts even in inputs
    const isNavigationShortcut = event.altKey;

    if (isEditable && !isNavigationShortcut) {
      return;
    }

    const shortcut = this.findMatchingShortcut(event);
    if (shortcut) {
      event.preventDefault();
      this.executeShortcut(shortcut);
      this.announce(shortcut.description);
    }
  }

  private findMatchingShortcut(event: KeyboardEvent): KeyboardShortcut | undefined {
    return SHORTCUTS.find(shortcut => {
      if (shortcut.key.toLowerCase() !== event.key.toLowerCase()) return false;
      
      const modifiers = shortcut.modifiers || [];
      return (
        (shortcut.modifiers?.includes('ctrl') ? event.ctrlKey : !event.ctrlKey) &&
        (shortcut.modifiers?.includes('alt') ? event.altKey : !event.altKey) &&
        (shortcut.modifiers?.includes('shift') ? event.shiftKey : !event.shiftKey) &&
        (shortcut.modifiers?.includes('meta') ? event.metaKey : !event.metaKey)
      );
    });
  }

  private executeShortcut(shortcut: KeyboardShortcut) {
    const handler = this.handlers.get(shortcut.action);
    if (handler) {
      handler({ type: shortcut.action, shortcut: shortcut.key });
    }
  }

  registerHandler(action: string, handler: KeyboardShortcutHandler) {
    this.handlers.set(action, handler);
  }

  unregisterHandler(action: string) {
    this.handlers.delete(action);
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  getShortcuts(category?: string): KeyboardShortcut[] {
    if (category) {
      return SHORTCUTS.filter(s => s.category === category);
    }
    return [...SHORTCUTS];
  }

  getShortcutForAction(action: string): KeyboardShortcut | undefined {
    return SHORTCUTS.find(s => s.action === action);
  }

  formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    if (shortcut.modifiers?.includes('ctrl')) parts.push('Ctrl');
    if (shortcut.modifiers?.includes('alt')) parts.push('Alt');
    if (shortcut.modifiers?.includes('shift')) parts.push('Shift');
    if (shortcut.modifiers?.includes('meta')) parts.push('Cmd');
    parts.push(shortcut.key);
    return parts.join('+');
  }
}

let instance: KeyboardNavigationService | null = null;

export function initKeyboardShortcuts(
  defaultHandler?: KeyboardShortcutHandler
): KeyboardNavigationService {
  if (!instance) {
    instance = new KeyboardNavigationService();
    
    // Register default handlers
    if (defaultHandler) {
      instance.registerHandler('navigate-overview', defaultHandler);
      instance.registerHandler('navigate-dashboard', defaultHandler);
      instance.registerHandler('navigate-incidents', defaultHandler);
      instance.registerHandler('navigate-simulations', defaultHandler);
      instance.registerHandler('navigate-reports', defaultHandler);
      instance.registerHandler('close-modal', defaultHandler);
      instance.registerHandler('panel-prev', defaultHandler);
      instance.registerHandler('panel-next', defaultHandler);
    }
  }
  return instance;
}

export function getKeyboardNavigation(): KeyboardNavigationService {
  return instance || initKeyboardShortcuts();
}

/** Return a display label like "Ctrl+Shift+1" for a given roleId index in ROLE_NAV order */
export function getShortcutLabel(roleIdOrIndex: string | number): string {
  // sc-app-shell uses roleId strings; map them to a 1-based index
  const roleIds = [
    'ciso', 'secuclaw-commander', 'security-ops', 'security-expert',
    'security-architect', 'privacy-officer', 'business-security-officer', 'supply-chain-security'
  ];
  let idx: number;
  if (typeof roleIdOrIndex === 'number') {
    idx = roleIdOrIndex;
  } else {
    idx = roleIds.indexOf(roleIdOrIndex);
    if (idx === -1) return '';
  }
  return `Ctrl+Shift+${idx + 1}`;
}
