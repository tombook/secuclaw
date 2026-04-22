import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * Comprehensive Accessibility Manager Component
 * Manages all accessibility features including screen reader support,
 * keyboard navigation, high contrast mode, and focus management
 */
@customElement('sc-accessibility-manager')
export class ScAccessibilityManager extends LitElement {
  
  static styles = css`
    :host {
      display: block;
      --primary-color: #00d4ff;
      --secondary-color: #7c3aed;
      --danger-color: #ef4444;
      --success-color: #10b981;
      --warning-color: #f59e0b;
      --bg-dark: #0a0f1a;
      --bg-card: #111827;
      --bg-hover: #1f2937;
      --text-primary: #f9fafb;
      --text-secondary: #9ca3af;
      --border-color: #374151;
    }

    .a11y-panel {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      color: var(--text-primary);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .panel-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .panel-title svg {
      width: 22px;
      height: 22px;
      color: var(--primary-color);
    }

    .a11y-section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-title svg {
      width: 18px;
      height: 18px;
      color: var(--primary-color);
    }

    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);
    }

    .setting-row:last-child {
      border-bottom: none;
    }

    .setting-info {
      flex: 1;
    }

    .setting-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .setting-description {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .toggle-switch {
      position: relative;
      width: 48px;
      height: 26px;
      background: var(--border-color);
      border-radius: 13px;
      cursor: pointer;
      transition: background 0.2s;
      border: none;
      padding: 0;
    }

    .toggle-switch::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      transition: transform 0.2s;
    }

    .toggle-switch[checked] {
      background: var(--primary-color);
    }

    .toggle-switch[checked]::after {
      transform: translateX(22px);
    }

    .toggle-switch:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .size-control {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .size-btn {
      width: 36px;
      height: 36px;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      background: var(--bg-dark);
      color: var(--text-primary);
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .size-btn:hover {
      border-color: var(--primary-color);
      background: var(--bg-hover);
    }

    .size-btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .size-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .size-indicator {
      min-width: 60px;
      text-align: center;
      font-size: 14px;
      color: var(--text-secondary);
    }

    .contrast-options {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .contrast-option {
      flex: 1;
      min-width: 120px;
      padding: 16px;
      border: 2px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-dark);
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }

    .contrast-option:hover {
      border-color: var(--primary-color);
    }

    .contrast-option.active {
      border-color: var(--primary-color);
      background: rgba(0, 212, 255, 0.1);
    }

    .contrast-option:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .contrast-preview {
      width: 100%;
      height: 40px;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .contrast-preview.normal {
      background: linear-gradient(135deg, #0a0f1a 50%, #f9fafb 50%);
    }

    .contrast-preview.high {
      background: #000000;
      border: 2px solid #ffffff;
    }

    .contrast-preview.protanopia {
      background: linear-gradient(135deg, #4a3f35 50%, #c9c5c0 50%);
    }

    .contrast-preview.deuteranopia {
      background: linear-gradient(135deg, #3f4a35 50%, #c5c9c0 50%);
    }

    .contrast-preview.tritanopia {
      background: linear-gradient(135deg, #3f354a 50%, #c0c5c9 50%);
    }

    .contrast-label {
      font-size: 12px;
      color: var(--text-primary);
      font-weight: 500;
    }

    .keyboard-nav-hint {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: var(--bg-dark);
      border-radius: 8px;
      margin-bottom: 12px;
    }

    .key-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 28px;
      padding: 0 8px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      font-family: monospace;
      color: var(--text-primary);
    }

    .keyboard-description {
      flex: 1;
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .shortcuts-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .shortcut-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: var(--bg-dark);
      border-radius: 6px;
    }

    .shortcut-keys {
      display: flex;
      gap: 4px;
    }

    .shortcut-desc {
      flex: 1;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .focus-indicator {
      width: 100%;
      height: 60px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: var(--text-secondary);
      transition: outline 0.1s;
    }

    .focus-indicator:focus-within {
      outline: 3px solid var(--primary-color);
      outline-offset: 2px;
    }

    .focus-indicator.strong-focus:focus-within {
      outline: 4px solid var(--warning-color);
      outline-offset: 4px;
    }

    .skip-links {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 10000;
    }

    .skip-link {
      position: absolute;
      top: -100px;
      left: 16px;
      padding: 12px 24px;
      background: var(--primary-color);
      color: var(--bg-dark);
      font-weight: 600;
      border-radius: 0 0 8px 8px;
      text-decoration: none;
      transition: top 0.2s;
    }

    .skip-link:focus {
      top: 0;
      outline: none;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .live-regions {
      margin-top: 24px;
      padding: 16px;
      background: var(--bg-dark);
      border-radius: 8px;
    }

    .live-region {
      padding: 12px;
      background: var(--bg-card);
      border-radius: 6px;
      margin-bottom: 8px;
    }

    .live-region:last-child {
      margin-bottom: 0;
    }

    .live-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .live-content {
      font-size: 13px;
      color: var(--text-primary);
      min-height: 20px;
    }

    .btn {
      padding: 10px 16px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-dark);
      color: var(--text-primary);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }

    .btn:hover {
      border-color: var(--primary-color);
    }

    .btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .btn-primary {
      background: var(--primary-color);
      color: var(--bg-dark);
      border-color: var(--primary-color);
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      flex-wrap: wrap;
    }

    @media (max-width: 768px) {
      .setting-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .contrast-options {
        flex-direction: column;
      }

      .action-buttons {
        flex-direction: column;
      }
    }
  `;

  @state() private highContrast = false;
  @state() private reducedMotion = false;
  @state() private largeText = false;
  @state() private screenReaderOptimized = false;
  @state() private keyboardNavigation = true;
  @state() private fontSize = 14;
  @state() private colorScheme: 'normal' | 'high-contrast' | 'protanopia' | 'deuteranopia' | 'tritanopia' = 'normal';
  @state() private ariaLiveContent = '';

  connectedCallback() {
    super.connectedCallback();
    this.loadPreferences();
    this.setupKeyboardShortcuts();
    this.setupLiveRegion();
  }

  private loadPreferences() {
    try {
      const saved = localStorage.getItem('secuclaw-a11y');
      if (saved) {
        const prefs = JSON.parse(saved);
        this.highContrast = prefs.highContrast || false;
        this.reducedMotion = prefs.reducedMotion || false;
        this.largeText = prefs.largeText || false;
        this.screenReaderOptimized = prefs.screenReaderOptimized || false;
        this.keyboardNavigation = prefs.keyboardNavigation !== false;
        this.fontSize = prefs.fontSize || 14;
        this.colorScheme = prefs.colorScheme || 'normal';
      }
    } catch {
      // Use defaults
    }

    // Check system preferences
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this.reducedMotion = true;
    }
  }

  private savePreferences() {
    try {
      localStorage.setItem('secuclaw-a11y', JSON.stringify({
        highContrast: this.highContrast,
        reducedMotion: this.reducedMotion,
        largeText: this.largeText,
        screenReaderOptimized: this.screenReaderOptimized,
        keyboardNavigation: this.keyboardNavigation,
        fontSize: this.fontSize,
        colorScheme: this.colorScheme,
      }));
    } catch {
      // Ignore
    }
  }

  private setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey) {
        switch(e.key.toLowerCase()) {
          case 'h':
            e.preventDefault();
            this.toggleHighContrast();
            break;
          case 'k':
            e.preventDefault();
            this.toggleKeyboardNav();
            break;
          case 'r':
            e.preventDefault();
            this.toggleReducedMotion();
            break;
        }
      }
    });
  }

  private setupLiveRegion() {
    // Create aria-live region
    const liveRegion = document.createElement('div');
    liveRegion.id = 'a11y-announcer';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  private announce(message: string) {
    const liveRegion = document.getElementById('a11y-announcer');
    if (liveRegion) {
      liveRegion.textContent = message;
      setTimeout(() => { liveRegion.textContent = ''; }, 1000);
    }
    this.ariaLiveContent = message;
  }

  private toggleHighContrast() {
    this.highContrast = !this.highContrast;
    this.applyPreferences();
    this.announce(`High contrast ${this.highContrast ? 'enabled' : 'disabled'}`);
  }

  private toggleReducedMotion() {
    this.reducedMotion = !this.reducedMotion;
    this.applyPreferences();
    this.announce(`Reduced motion ${this.reducedMotion ? 'enabled' : 'disabled'}`);
  }

  private toggleKeyboardNav() {
    this.keyboardNavigation = !this.keyboardNavigation;
    this.announce(`Keyboard navigation ${this.keyboardNavigation ? 'enabled' : 'disabled'}`);
  }

  private toggleLargeText() {
    this.largeText = !this.largeText;
    this.fontSize = this.largeText ? 18 : 14;
    this.applyPreferences();
    this.announce(`Large text ${this.largeText ? 'enabled' : 'disabled'}`);
  }

  private toggleScreenReader() {
    this.screenReaderOptimized = !this.screenReaderOptimized;
    this.applyPreferences();
    this.announce(`Screen reader optimization ${this.screenReaderOptimized ? 'enabled' : 'disabled'}`);
  }

  private setColorScheme(scheme: typeof this.colorScheme) {
    this.colorScheme = scheme;
    this.applyPreferences();
    this.announce(`Color scheme changed to ${scheme}`);
  }

  private adjustFontSize(delta: number) {
    const newSize = Math.max(12, Math.min(24, this.fontSize + delta));
    this.fontSize = newSize;
    this.largeText = newSize > 14;
    this.applyPreferences();
    this.announce(`Font size ${newSize}px`);
  }

  private applyPreferences() {
    this.savePreferences();

    // Apply to document
    document.documentElement.style.fontSize = `${this.fontSize}px`;
    document.documentElement.classList.toggle('high-contrast', this.highContrast);
    document.documentElement.classList.toggle('reduced-motion', this.reducedMotion);
    document.documentElement.classList.toggle('screen-reader-optimized', this.screenReaderOptimized);

    // Apply color scheme filter
    const filters: Record<string, string> = {
      'normal': 'none',
      'high-contrast': 'contrast(1.5)',
      'protanopia': 'url(#protanopia)',
      'deuteranopia': 'url(#deuteranopia)',
      'tritanopia': 'url(#tritanopia)',
    };
    document.documentElement.style.filter = filters[this.colorScheme];
  }

  private resetToDefaults() {
    this.highContrast = false;
    this.reducedMotion = false;
    this.largeText = false;
    this.screenReaderOptimized = false;
    this.keyboardNavigation = true;
    this.fontSize = 14;
    this.colorScheme = 'normal';
    this.applyPreferences();
    this.announce('Accessibility settings reset to defaults');
  }

  render() {
    return html`
      <!-- Skip Link for keyboard users -->
      <div class="skip-links">
        <a href="#main-content" class="skip-link">Skip to main content</a>
      </div>

      <div class="a11y-panel" role="region" aria-labelledby="a11y-title">
        <div class="panel-header">
          <h2 id="a11y-title" class="panel-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
            </svg>
            Accessibility Settings
          </h2>
        </div>

        <!-- Vision Section -->
        <div class="a11y-section" role="group" aria-labelledby="vision-title">
          <h3 id="vision-title" class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Vision
          </h3>

          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">High Contrast Mode</div>
              <div class="setting-description">Increase contrast for better visibility</div>
            </div>
            <button 
              class="toggle-switch ${this.highContrast ? '[checked]' : ''}"
              @click="${this.toggleHighContrast}"
              role="switch"
              aria-checked="${this.highContrast}"
              aria-label="Toggle high contrast mode"
            ></button>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Font Size</div>
              <div class="setting-description">Adjust text size for readability</div>
            </div>
            <div class="size-control">
              <button 
                class="size-btn" 
                @click="${() => this.adjustFontSize(-2)}"
                ?disabled="${this.fontSize <= 12}"
                aria-label="Decrease font size"
              >A-</button>
              <span class="size-indicator">${this.fontSize}px</span>
              <button 
                class="size-btn" 
                @click="${() => this.adjustFontSize(2)}"
                ?disabled="${this.fontSize >= 24}"
                aria-label="Increase font size"
              >A+</button>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Color Scheme</div>
              <div class="setting-description">Optimize for color vision deficiency</div>
            </div>
          </div>
          <div class="contrast-options" role="radiogroup" aria-label="Color scheme options">
            ${(['normal', 'high-contrast', 'protanopia', 'deuteranopia', 'tritanopia'] as const).map(scheme => html`
              <button 
                class="contrast-option ${this.colorScheme === scheme ? 'active' : ''}"
                @click="${() => this.setColorScheme(scheme)}"
                role="radio"
                aria-checked="${this.colorScheme === scheme}"
              >
                <div class="contrast-preview ${scheme}"></div>
                <span class="contrast-label">${scheme.replace('-', ' ')}</span>
              </button>
            `)}
          </div>
        </div>

        <!-- Motion Section -->
        <div class="a11y-section" role="group" aria-labelledby="motion-title">
          <h3 id="motion-title" class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            Motion
          </h3>

          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Reduce Motion</div>
              <div class="setting-description">Minimize animations and transitions</div>
            </div>
            <button 
              class="toggle-switch ${this.reducedMotion ? '[checked]' : ''}"
              @click="${this.toggleReducedMotion}"
              role="switch"
              aria-checked="${this.reducedMotion}"
              aria-label="Toggle reduced motion"
            ></button>
          </div>
        </div>

        <!-- Keyboard Navigation Section -->
        <div class="a11y-section" role="group" aria-labelledby="keyboard-title">
          <h3 id="keyboard-title" class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
            </svg>
            Keyboard Navigation
          </h3>

          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Keyboard Navigation</div>
              <div class="setting-description">Enable full keyboard accessibility</div>
            </div>
            <button 
              class="toggle-switch ${this.keyboardNavigation ? '[checked]' : ''}"
              @click="${this.toggleKeyboardNav}"
              role="switch"
              aria-checked="${this.keyboardNavigation}"
              aria-label="Toggle keyboard navigation"
            ></button>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Focus Indicator</div>
              <div class="setting-description">Current focus state visualization</div>
            </div>
          </div>
          <div class="focus-indicator" tabindex="0" role="button" aria-label="Example focusable element">
            Press Tab to see focus indicator
          </div>

          <h4 class="section-title" style="margin-top: 20px; font-size: 13px;">Keyboard Shortcuts</h4>
          <div class="shortcuts-list" role="list">
            <div class="shortcut-item">
              <div class="shortcut-keys">
                <span class="key-badge">Ctrl</span>
                <span class="key-badge">Alt</span>
                <span class="key-badge">H</span>
              </div>
              <span class="shortcut-desc">Toggle high contrast</span>
            </div>
            <div class="shortcut-item">
              <div class="shortcut-keys">
                <span class="key-badge">Ctrl</span>
                <span class="key-badge">Alt</span>
                <span class="key-badge">K</span>
              </div>
              <span class="shortcut-desc">Toggle keyboard navigation</span>
            </div>
            <div class="shortcut-item">
              <div class="shortcut-keys">
                <span class="key-badge">Tab</span>
              </div>
              <span class="shortcut-desc">Move between elements</span>
            </div>
            <div class="shortcut-item">
              <div class="shortcut-keys">
                <span class="key-badge">Enter</span>
              </div>
              <span class="shortcut-desc">Activate buttons and links</span>
            </div>
            <div class="shortcut-item">
              <div class="shortcut-keys">
                <span class="key-badge">Esc</span>
              </div>
              <span class="shortcut-desc">Close dialogs and menus</span>
            </div>
          </div>
        </div>

        <!-- Screen Reader Section -->
        <div class="a11y-section" role="group" aria-labelledby="sr-title">
          <h3 id="sr-title" class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            </svg>
            Screen Reader
          </h3>

          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Screen Reader Optimization</div>
              <div class="setting-description">Enhanced labels and descriptions for assistive technology</div>
            </div>
            <button 
              class="toggle-switch ${this.screenReaderOptimized ? '[checked]' : ''}"
              @click="${this.toggleScreenReader}"
              role="switch"
              aria-checked="${this.screenReaderOptimized}"
              aria-label="Toggle screen reader optimization"
            ></button>
          </div>

          <div class="live-regions">
            <div class="live-region">
              <div class="live-label">ARIA Live Region (Polite)</div>
              <div class="live-content" aria-live="polite">${this.ariaLiveContent || 'Announcements will appear here...'}</div>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn btn-primary" @click="${this.resetToDefaults}">
            Reset to Defaults
          </button>
          <button class="btn" @click="${() => this.announce('Settings saved successfully')}">
            Save Settings
          </button>
        </div>
      </div>

      <!-- SVG Filters for Color Blindness -->
      <svg class="sr-only" aria-hidden="true">
        <defs>
          <filter id="protanopia">
            <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0 0.558, 0.442, 0, 0, 0 0, 0.242, 0.758, 0, 0 0, 0, 0, 1, 0"/>
          </filter>
          <filter id="deuteranopia">
            <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0 0.7, 0.3, 0, 0, 0 0, 0.3, 0.7, 0, 0 0, 0, 0, 1, 0"/>
          </filter>
          <filter id="tritanopia">
            <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0 0, 0.433, 0.567, 0, 0 0, 0.475, 0.525, 0, 0 0, 0, 0, 1, 0"/>
          </filter>
        </defs>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-accessibility-manager': ScAccessibilityManager;
  }
}
