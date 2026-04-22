/**
 * SecuClaw Theme System v3.0
 * Comprehensive theming with dark mode, accessibility, and role-based themes
 * Enhanced with CSS custom properties for full dark mode consistency
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'default' | 'high-contrast' | 'protanopia' | 'deuteranopia' | 'tritanopia';
export type RoleTheme = 'security-expert' | 'privacy-officer' | 'security-architect' | 'business-security-officer' | 'secuclaw-commander' | 'ciso' | 'security-ops' | 'supply-chain-security';

export interface ThemeConfig {
  mode: ThemeMode;
  scheme: ColorScheme;
  role: RoleTheme | null;
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  reduceMotion: boolean;
  focusVisible: boolean;
  highContrast: boolean;
}

// Complete dark mode color palette for full consistency
export const darkModeColors = {
  // Backgrounds
  '--bg-primary': '#0a0f1a',
  '--bg-secondary': '#111827',
  '--bg-tertiary': '#1f2937',
  '--bg-elevated': '#374151',
  '--bg-hover': '#1e2937',
  '--bg-active': '#2d3748',
  
  // Text
  '--text-primary': '#f9fafb',
  '--text-secondary': '#9ca3af',
  '--text-muted': '#6b7280',
  '--text-disabled': '#4b5563',
  '--text-inverse': '#0f172a',
  
  // Borders
  '--border-color': '#374151',
  '--border-strong': '#4b5563',
  '--border-focus': '#00d4ff',
  '--border-subtle': '#1f2937',
  
  // Security semantic colors
  '--severity-critical': '#ef4444',
  '--severity-critical-bg': 'rgba(239, 68, 68, 0.15)',
  '--severity-critical-border': 'rgba(239, 68, 68, 0.4)',
  
  '--severity-high': '#f97316',
  '--severity-high-bg': 'rgba(249, 115, 22, 0.15)',
  '--severity-high-border': 'rgba(249, 115, 22, 0.4)',
  
  '--severity-medium': '#f59e0b',
  '--severity-medium-bg': 'rgba(245, 158, 11, 0.15)',
  '--severity-medium-border': 'rgba(245, 158, 11, 0.4)',
  
  '--severity-low': '#22c55e',
  '--severity-low-bg': 'rgba(34, 197, 94, 0.15)',
  '--severity-low-border': 'rgba(34, 197, 94, 0.4)',
  
  '--severity-info': '#3b82f6',
  '--severity-info-bg': 'rgba(59, 130, 246, 0.15)',
  '--severity-info-border': 'rgba(59, 130, 246, 0.4)',
  
  // Primary brand colors
  '--primary': '#00d4ff',
  '--primary-hover': '#00b8e6',
  '--primary-active': '#0099cc',
  '--primary-muted': 'rgba(0, 212, 255, 0.15)',
  '--primary-subtle': 'rgba(0, 212, 255, 0.08)',
  
  // Secondary brand colors
  '--secondary': '#7c3aed',
  '--secondary-hover': '#6d28d9',
  '--secondary-active': '#5b21b6',
  '--secondary-muted': 'rgba(124, 58, 237, 0.15)',
  
  // Semantic colors
  '--success': '#22c55e',
  '--success-bg': 'rgba(34, 197, 94, 0.15)',
  '--success-border': 'rgba(34, 197, 94, 0.4)',
  '--success-text': '#16a34a',
  
  '--warning': '#f59e0b',
  '--warning-bg': 'rgba(245, 158, 11, 0.15)',
  '--warning-border': 'rgba(245, 158, 11, 0.4)',
  '--warning-text': '#d97706',
  
  '--danger': '#ef4444',
  '--danger-bg': 'rgba(239, 68, 68, 0.15)',
  '--danger-border': 'rgba(239, 68, 68, 0.4)',
  '--danger-text': '#dc2626',
  
  '--info': '#3b82f6',
  '--info-bg': 'rgba(59, 130, 246, 0.15)',
  '--info-border': 'rgba(59, 130, 246, 0.4)',
  '--info-text': '#2563eb',
  
  // Shadows for dark mode
  '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
  '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.4)',
  '--shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.5)',
  '--shadow-xl': '0 20px 25px rgba(0, 0, 0, 0.6)',
  '--shadow-glow': '0 0 20px rgba(0, 212, 255, 0.2)',
  
  // Overlay colors
  '--overlay-light': 'rgba(255, 255, 255, 0.05)',
  '--overlay-dark': 'rgba(0, 0, 0, 0.5)',
  '--overlay-strong': 'rgba(0, 0, 0, 0.7)',
};

// Light mode colors
export const lightModeColors = {
  // Backgrounds
  '--bg-primary': '#ffffff',
  '--bg-secondary': '#f9fafb',
  '--bg-tertiary': '#f3f4f6',
  '--bg-elevated': '#e5e7eb',
  '--bg-hover': '#f3f4f6',
  '--bg-active': '#e5e7eb',
  
  // Text
  '--text-primary': '#111827',
  '--text-secondary': '#4b5563',
  '--text-muted': '#9ca3af',
  '--text-disabled': '#d1d5db',
  '--text-inverse': '#ffffff',
  
  // Borders
  '--border-color': '#e5e7eb',
  '--border-strong': '#d1d5db',
  '--border-focus': '#3b82f6',
  '--border-subtle': '#f3f4f6',
  
  // Security semantic colors - adjusted for light mode
  '--severity-critical': '#dc2626',
  '--severity-critical-bg': 'rgba(220, 38, 38, 0.1)',
  '--severity-critical-border': 'rgba(220, 38, 38, 0.3)',
  
  '--severity-high': '#ea580c',
  '--severity-high-bg': 'rgba(234, 88, 12, 0.1)',
  '--severity-high-border': 'rgba(234, 88, 12, 0.3)',
  
  '--severity-medium': '#d97706',
  '--severity-medium-bg': 'rgba(217, 119, 6, 0.1)',
  '--severity-medium-border': 'rgba(217, 119, 6, 0.3)',
  
  '--severity-low': '#16a34a',
  '--severity-low-bg': 'rgba(22, 163, 74, 0.1)',
  '--severity-low-border': 'rgba(22, 163, 74, 0.3)',
  
  '--severity-info': '#2563eb',
  '--severity-info-bg': 'rgba(37, 99, 235, 0.1)',
  '--severity-info-border': 'rgba(37, 99, 235, 0.3)',
  
  // Primary brand colors
  '--primary': '#0891b2',
  '--primary-hover': '#0e7490',
  '--primary-active': '#155e75',
  '--primary-muted': 'rgba(8, 145, 178, 0.12)',
  '--primary-subtle': 'rgba(8, 145, 178, 0.06)',
  
  // Secondary brand colors
  '--secondary': '#7c3aed',
  '--secondary-hover': '#6d28d9',
  '--secondary-active': '#5b21b6',
  '--secondary-muted': 'rgba(124, 58, 237, 0.12)',
  
  // Semantic colors
  '--success': '#16a34a',
  '--success-bg': 'rgba(22, 163, 74, 0.1)',
  '--success-border': 'rgba(22, 163, 74, 0.3)',
  '--success-text': '#15803d',
  
  '--warning': '#d97706',
  '--warning-bg': 'rgba(217, 119, 6, 0.1)',
  '--warning-border': 'rgba(217, 119, 6, 0.3)',
  '--warning-text': '#b45309',
  
  '--danger': '#dc2626',
  '--danger-bg': 'rgba(220, 38, 38, 0.1)',
  '--danger-border': 'rgba(220, 38, 38, 0.3)',
  '--danger-text': '#b91c1c',
  
  '--info': '#2563eb',
  '--info-bg': 'rgba(37, 99, 235, 0.1)',
  '--info-border': 'rgba(37, 99, 235, 0.3)',
  '--info-text': '#1d4ed8',
  
  // Shadows for light mode
  '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
  '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
  '--shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.15)',
  '--shadow-xl': '0 20px 25px rgba(0, 0, 0, 0.2)',
  '--shadow-glow': '0 0 20px rgba(8, 145, 178, 0.15)',
  
  // Overlay colors
  '--overlay-light': 'rgba(0, 0, 0, 0.02)',
  '--overlay-dark': 'rgba(0, 0, 0, 0.05)',
  '--overlay-strong': 'rgba(0, 0, 0, 0.5)',
};

// Shared spacing and radius
export const layoutConstants = {
  '--space-xs': '4px',
  '--space-sm': '8px',
  '--space-md': '16px',
  '--space-lg': '24px',
  '--space-xl': '32px',
  '--space-2xl': '48px',
  
  '--radius-sm': '4px',
  '--radius-md': '8px',
  '--radius-lg': '12px',
  '--radius-xl': '16px',
  '--radius-full': '9999px',
  
  '--transition-fast': '150ms ease',
  '--transition-base': '200ms ease',
  '--transition-slow': '300ms ease',
  '--transition-slower': '500ms ease',
};

// Font sizes
export const fontSizes = {
  small: {
    '--font-size-xs': '11px',
    '--font-size-sm': '12px',
    '--font-size-base': '13px',
    '--font-size-lg': '14px',
    '--font-size-xl': '16px',
    '--font-size-2xl': '18px',
    '--font-size-3xl': '20px',
    '--font-size-4xl': '24px',
  },
  medium: {
    '--font-size-xs': '12px',
    '--font-size-sm': '13px',
    '--font-size-base': '14px',
    '--font-size-lg': '15px',
    '--font-size-xl': '17px',
    '--font-size-2xl': '20px',
    '--font-size-3xl': '22px',
    '--font-size-4xl': '28px',
  },
  large: {
    '--font-size-xs': '13px',
    '--font-size-sm': '14px',
    '--font-size-base': '16px',
    '--font-size-lg': '17px',
    '--font-size-xl': '19px',
    '--font-size-2xl': '22px',
    '--font-size-3xl': '26px',
    '--font-size-4xl': '32px',
  },
  'x-large': {
    '--font-size-xs': '14px',
    '--font-size-sm': '16px',
    '--font-size-base': '18px',
    '--font-size-lg': '20px',
    '--font-size-xl': '22px',
    '--font-size-2xl': '26px',
    '--font-size-3xl': '30px',
    '--font-size-4xl': '36px',
  },
};

// High contrast mode overrides
export const highContrastOverrides = {
  '--border-color': '#ffffff',
  '--border-strong': '#ffffff',
  '--text-secondary': '#e5e7eb',
  '--shadow-sm': '0 0 0 1px white',
  '--shadow-md': '0 0 0 2px white',
};

// Color blindness filters
export const colorBlindFilters: Record<string, string> = {
  protanopia: 'url(#protanopia)',
  deuteranopia: 'url(#deuteranopia)',
  tritanopia: 'url(#tritanopia)',
};

// SVG filter definitions
export const colorBlindnessFilters = `
  <defs>
    <filter id="protanopia">
      <feColorMatrix type="matrix" values="
        0.567, 0.433, 0,     0, 0
        0.558, 0.442, 0,     0, 0
        0,     0.242, 0.758, 0, 0
        0,     0,     0,     1, 0
      "/>
    </filter>
    <filter id="deuteranopia">
      <feColorMatrix type="matrix" values="
        0.625, 0.375, 0,   0, 0
        0.7,   0.3,   0,   0, 0
        0,     0.3,   0.7, 0, 0
        0,     0,     0,   1, 0
      "/>
    </filter>
    <filter id="tritanopia">
      <feColorMatrix type="matrix" values="
        0.95, 0.05,  0,     0, 0
        0,    0.433, 0.567, 0, 0
        0,    0.475, 0.525, 0, 0
        0,    0,     0,     1, 0
      "/>
    </filter>
  </defs>
`;

// Role-specific theme configurations
export const roleThemes: Record<RoleTheme, Record<string, string>> = {
  'security-expert': {},
  'privacy-officer': {
    '--primary': '#8b5cf6',
    '--success': '#059669',
  },
  'security-architect': {
    '--primary': '#0ea5e9',
    '--secondary': '#6366f1',
  },
  'business-security-officer': {
    '--primary': '#22c55e',
    '--success': '#16a34a',
  },
  'secuclaw-commander': {
    '--primary': '#f59e0b',
    '--warning': '#dc2626',
  },
  'ciso': {
    '--primary': '#3b82f6',
    '--secondary': '#8b5cf6',
  },
  'security-ops': {
    '--primary': '#ef4444',
    '--secondary': '#f97316',
  },
  'supply-chain-security': {
    '--primary': '#14b8a6',
    '--secondary': '#06b6d4',
  },
};

// Theme application class
export class SecuClawThemeSystem {
  private root: HTMLElement;
  private config: ThemeConfig;

  constructor(root: HTMLElement = document.documentElement) {
    this.root = root;
    this.config = {
      mode: 'dark',
      scheme: 'default',
      role: null,
      fontSize: 'medium',
      reduceMotion: false,
      focusVisible: true,
      highContrast: false,
    };
    
    this.detectSystemPreferences();
    this.loadSavedConfig();
  }

  private detectSystemPreferences(): void {
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      // Will be used if mode is 'system'
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this.config.reduceMotion = true;
    }
    if (window.matchMedia?.('(prefers-contrast: more)').matches) {
      this.config.highContrast = true;
    }
  }

  private loadSavedConfig(): void {
    try {
      const saved = localStorage.getItem('secuclaw-theme');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch {
      // Use defaults
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('secuclaw-theme', JSON.stringify(this.config));
    } catch {
      // Ignore storage errors
    }
  }

  apply(config?: Partial<ThemeConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.saveConfig();
    this.applyTheme();
  }

  private applyTheme(): void {
    const { mode, scheme, role, fontSize, reduceMotion, highContrast } = this.config;

    // Determine effective mode
    let effectiveMode = mode;
    if (mode === 'system') {
      effectiveMode = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Apply base colors based on mode
    const baseColors = effectiveMode === 'dark' ? darkModeColors : lightModeColors;
    Object.entries(baseColors).forEach(([prop, value]) => {
      this.root.style.setProperty(prop, value);
    });

    // Apply layout constants
    Object.entries(layoutConstants).forEach(([prop, value]) => {
      this.root.style.setProperty(prop, value);
    });

    // Apply font sizes
    const sizes = fontSizes[fontSize];
    Object.entries(sizes).forEach(([prop, value]) => {
      this.root.style.setProperty(prop, value);
    });

    // Apply role theme
    if (role && roleThemes[role]) {
      Object.entries(roleThemes[role]).forEach(([prop, value]) => {
        this.root.style.setProperty(prop, value);
      });
    }

    // Apply high contrast
    if (highContrast) {
      Object.entries(highContrastOverrides).forEach(([prop, value]) => {
        this.root.style.setProperty(prop, value);
      });
    }

    // Apply color blindness filter
    if (scheme !== 'default') {
      this.root.style.filter = colorBlindFilters[scheme];
    } else {
      this.root.style.filter = 'none';
    }

    // Add mode class
    this.root.classList.remove('light', 'dark', 'system');
    this.root.classList.add(effectiveMode);

    // Add scheme class
    this.root.classList.remove('default-scheme', 'high-contrast', 'protanopia', 'deuteranopia', 'tritanopia');
    this.root.classList.add(`${scheme === 'default' ? 'default' : scheme}-scheme`);

    // Add font size class
    this.root.classList.remove('font-small', 'font-medium', 'font-large', 'font-x-large');
    this.root.classList.add(`font-${fontSize}`);

    // Add motion class
    this.root.classList.toggle('reduce-motion', reduceMotion);

    // Add high contrast class
    this.root.classList.toggle('high-contrast-mode', highContrast);

    // Update meta theme-color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', effectiveMode === 'dark' ? '#0a0f1a' : '#ffffff');
    }

    // Dispatch custom event for components to react
    window.dispatchEvent(new CustomEvent('theme-change', { 
      detail: { mode: effectiveMode, config: this.config } 
    }));
  }

  setMode(mode: ThemeMode): void {
    this.apply({ mode });
  }

  setScheme(scheme: ColorScheme): void {
    this.apply({ scheme });
  }

  setRole(role: RoleTheme | null): void {
    this.apply({ role });
  }

  setFontSize(size: 'small' | 'medium' | 'large' | 'x-large'): void {
    this.apply({ fontSize: size });
  }

  setReduceMotion(reduce: boolean): void {
    this.apply({ reduceMotion: reduce });
  }

  setFocusVisible(visible: boolean): void {
    this.apply({ focusVisible: visible });
  }

  setHighContrast(high: boolean): void {
    this.apply({ highContrast: high });
  }

  getConfig(): ThemeConfig {
    return { ...this.config };
  }

  toggleMode(): void {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(this.config.mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    this.setMode(nextMode);
  }

  increaseFontSize(): void {
    const sizes: Array<'small' | 'medium' | 'large' | 'x-large'> = ['small', 'medium', 'large', 'x-large'];
    const currentIndex = sizes.indexOf(this.config.fontSize);
    if (currentIndex < sizes.length - 1) {
      this.setFontSize(sizes[currentIndex + 1]);
    }
  }

  decreaseFontSize(): void {
    const sizes: Array<'small' | 'medium' | 'large' | 'x-large'> = ['small', 'medium', 'large', 'x-large'];
    const currentIndex = sizes.indexOf(this.config.fontSize);
    if (currentIndex > 0) {
      this.setFontSize(sizes[currentIndex - 1]);
    }
  }

  reset(): void {
    this.apply({
      mode: 'dark',
      scheme: 'default',
      role: null,
      fontSize: 'medium',
      reduceMotion: false,
      focusVisible: true,
      highContrast: false,
    });
  }
}

// Export singleton
let themeInstance: SecuClawThemeSystem | null = null;

export function initThemeSystem(root?: HTMLElement): SecuClawThemeSystem {
  if (!themeInstance) {
    themeInstance = new SecuClawThemeSystem(root);
    themeInstance.apply();
  }
  return themeInstance;
}

export function getThemeSystem(): SecuClawThemeSystem | null {
  return themeInstance;
}

// Keyboard shortcuts
export function setupThemeShortcuts(themeSystem: SecuClawThemeSystem): void {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      themeSystem.toggleMode();
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
      e.preventDefault();
      themeSystem.increaseFontSize();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '-') {
      e.preventDefault();
      themeSystem.decreaseFontSize();
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
      e.preventDefault();
      const config = themeSystem.getConfig();
      themeSystem.setHighContrast(!config.highContrast);
    }
  });
}

// CSS Variables export for use in components
export const CSS_VARS = {
  dark: darkModeColors,
  light: lightModeColors,
  layout: layoutConstants,
  fonts: fontSizes,
};

export default SecuClawThemeSystem;
