import type { ChatMessage } from './types.js';

export class Sanitizer {
  private static readonly IP_REGEX = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
  private static readonly EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  private static readonly PHONE_REGEX = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
  private static readonly PASSWORD_REGEX = /(?:password|passwd|pwd|secret|token|key|credential)["\s:=]+["']?([^"'\s,;}\]]+)/gi;
  private static readonly CREDIT_CARD_REGEX = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
  private static readonly CHINESE_ID_REGEX = /[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]/g;
  private static readonly API_KEY_REGEX = /(?:sk-|ak-|api[_-]?key)[=:]\s*["']?([a-zA-Z0-9_-]{20,})["']?/gi;
  private static readonly JWT_REGEX = /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g;
  private static readonly PRIVATE_KEY_REGEX = /-----BEGIN\s+(?:RSA\s+|EC\s+|DSA\s+|OPENSSH\s+)?PRIVATE\s+KEY-----/g;
  private static readonly AWS_KEY_REGEX = /AKIA[0-9A-Z]{16}/g;
  private static readonly CONN_STRING_REGEX = /(?:mongodb|postgres|mysql|redis|jdbc):\/\/[^:]+:[^@]+@/gi;

  private static readonly MAC_ADDRESS_REGEX = /([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}/g;

  static sanitize(messages: ChatMessage[]): ChatMessage[] {
    return messages.map(m => ({ ...m, content: this.sanitizeText(m.content) }));
  }

  static sanitizeText(text: string): string {
    return text
      .replace(this.PRIVATE_KEY_REGEX, '[REDACTED_KEY]')
      .replace(this.AWS_KEY_REGEX, '[REDACTED_AWS]')
      .replace(this.CONN_STRING_REGEX, '[REDACTED_CONN]')
      .replace(this.JWT_REGEX, '[REDACTED_JWT]')
      .replace(this.API_KEY_REGEX, '[REDACTED_APIKEY]')
      .replace(this.CHINESE_ID_REGEX, '[REDACTED_ID]')
      .replace(this.PASSWORD_REGEX, '$1[REDACTED]')
      .replace(this.IP_REGEX, '[REDACTED_IP]')
      .replace(this.EMAIL_REGEX, '[REDACTED_EMAIL]')
      .replace(this.PHONE_REGEX, '[REDACTED_PHONE]')
      .replace(this.CREDIT_CARD_REGEX, '[REDACTED_CC]')
      .replace(this.MAC_ADDRESS_REGEX, '[REDACTED_MAC]');
  }
}
