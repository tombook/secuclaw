export type Locale = 'zh-CN' | 'en' | 'zh-TW';
export type TranslationMap = Record<string, string | TranslationMap>;

// Vite import.meta.glob - 直接使用，不要通过 globalThis
const localeModules = import.meta.glob('../locales/*.ts', { eager: true });

interface I18nConfig {
  defaultLocale: Locale;
  supportedLocales: Locale[];
}

class I18nManager {
  private locale: Locale;
  private translations: Map<Locale, TranslationMap> = new Map();
  private subscribers = new Set<() => void>();

  constructor(config: I18nConfig) {
    this.locale = config.defaultLocale;
  }

  async setLocale(locale: Locale): Promise<void> {
    if (!this.translations.has(locale)) {
      await this.loadLocale(locale);
    }
    this.locale = locale;
    this.notify();
  }

  getLocale(): Locale {
    return this.locale;
  }

  private async loadLocale(locale: Locale): Promise<void> {
    const modulePath = `../locales/${locale}.ts`;
    const module = localeModules[modulePath];
    if (!module) {
      console.warn('[i18n] Locale file not found:', locale);
      return;
    }
    // With eager: true, modules are already loaded
    const localeKey = locale.replace('-', '_');
    // Try default export first, then named export (zh_CN, en, zh_TW)
    const translations = (module as Record<string, unknown>).default || (module as Record<string, unknown>)[localeKey] || {};
    this.translations.set(locale, translations as TranslationMap);
  }

  t(key: string, params?: Record<string, string>): string {
    const translation = this.translations.get(this.locale);
    if (!translation) return key;

    const value = this.getNestedValue(translation, key);
    if (value === undefined) return key;

    if (params) {
      return Object.entries(params).reduce(
        (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
        value
      );
    }

    return value;
  }

  private getNestedValue(obj: TranslationMap, key: string): string | undefined {
    const keys = key.split('.');
    let current: TranslationMap | string = obj;

    for (const k of keys) {
      if (typeof current === 'string') return undefined;
      current = (current as TranslationMap)[k];
      if (current === undefined) return undefined;
    }

    return typeof current === 'string' ? current : undefined;
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify(): void {
    this.subscribers.forEach((callback) => callback());
  }

  async initialize(defaultLocale: Locale): Promise<void> {
    await this.loadLocale(defaultLocale);
    this.locale = defaultLocale;
  }
}

export const i18n = new I18nManager({
  defaultLocale: 'zh-CN',
  supportedLocales: ['zh-CN', 'en', 'zh-TW'],
});

export async function initI18n(): Promise<void> {
  const savedLocale = localStorage.getItem('secuclaw-locale') as Locale | null;
  const locale = savedLocale || 'zh-CN';
  await i18n.initialize(locale);
}
