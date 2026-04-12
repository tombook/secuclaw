import type { ReactiveController, ReactiveControllerHost } from '@lit/reactive-element';
import { i18n } from './translate.js';
import type { Locale } from './translate.js';

export class I18nController implements ReactiveController {
  private host: ReactiveControllerHost;
  private unsubscribe: (() => void) | null = null;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {
    // Subscribe to locale changes
    this.unsubscribe = i18n.subscribe(() => {
      this.host.requestUpdate();
    });
    // Trigger initial render if translations already loaded
    this.host.requestUpdate();
  }

  hostDisconnected(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  t(key: string, defaultValueOrParams?: string | Record<string, string>): string {
    return i18n.t(key, defaultValueOrParams);
  }

  getLocale(): Locale {
    return i18n.getLocale();
  }

  async setLocale(locale: Locale): Promise<void> {
    await i18n.setLocale(locale);
  }
}
