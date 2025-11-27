/**
 * Shipi18n API Client
 *
 * Official Node.js client for the Shipi18n translation API.
 *
 * @example
 * ```typescript
 * import { Shipi18n } from '@shipi18n/api';
 *
 * const shipi18n = new Shipi18n({ apiKey: 'your-api-key' });
 *
 * // Translate JSON
 * const result = await shipi18n.translateJSON({
 *   content: { greeting: 'Hello', farewell: 'Goodbye' },
 *   sourceLanguage: 'en',
 *   targetLanguages: ['es', 'fr', 'de'],
 * });
 *
 * console.log(result.es); // { greeting: 'Hola', farewell: 'Adiós' }
 * ```
 */

export interface Shipi18nConfig {
  /** Your Shipi18n API key */
  apiKey: string;
  /** API base URL (default: https://api.shipi18n.com) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

export interface TranslateJSONOptions {
  /** JSON content to translate (object or JSON string) */
  content: Record<string, unknown> | string;
  /** Source language code (e.g., 'en') */
  sourceLanguage: string;
  /** Target language codes (e.g., ['es', 'fr', 'de']) */
  targetLanguages: string[];
  /** Preserve placeholders like {name}, {{count}}, etc. (default: true) */
  preservePlaceholders?: boolean;
  /** Enable i18next pluralization support (default: true) */
  enablePluralization?: boolean;
  /** Wrap output in a namespace (e.g., 'common') */
  namespace?: string;
  /** Auto-detect and group by namespaces: 'auto' | 'true' | 'false' (default: 'auto') */
  groupByNamespace?: 'auto' | 'true' | 'false';
  /** Export translations split by namespace */
  exportPerNamespace?: boolean;
}

export interface TranslateTextOptions {
  /** Text content to translate */
  content: string | string[];
  /** Source language code (e.g., 'en') */
  sourceLanguage: string;
  /** Target language codes (e.g., ['es', 'fr', 'de']) */
  targetLanguages: string[];
  /** Preserve placeholders like {name}, {{count}}, etc. (default: true) */
  preservePlaceholders?: boolean;
}

export interface TranslationResult {
  /** Translations keyed by language code */
  [languageCode: string]: Record<string, unknown> | TranslationPair[] | TranslationWarning[] | NamespaceInfo | undefined;
}

export interface TranslationPair {
  original: string;
  translated: string;
}

export interface TranslationWarning {
  type: string;
  message: string;
  details?: unknown;
}

export interface NamespaceInfo {
  detected: boolean;
  count?: number;
  namespaces?: Array<{ name: string; keyCount: number }>;
  userAssigned?: boolean;
  namespace?: string;
}

export class Shipi18nError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number, code: string = 'API_ERROR') {
    super(message);
    this.name = 'Shipi18nError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class Shipi18n {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: Shipi18nConfig) {
    if (!config.apiKey) {
      throw new Shipi18nError('API key is required', 400, 'MISSING_API_KEY');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.shipi18n.com';
    this.timeout = config.timeout || 30000;
  }

  /**
   * Translate JSON content to multiple languages
   *
   * @example
   * ```typescript
   * const result = await shipi18n.translateJSON({
   *   content: { greeting: 'Hello', farewell: 'Goodbye' },
   *   sourceLanguage: 'en',
   *   targetLanguages: ['es', 'fr'],
   * });
   * ```
   */
  async translateJSON(options: TranslateJSONOptions): Promise<TranslationResult> {
    const {
      content,
      sourceLanguage,
      targetLanguages,
      preservePlaceholders = true,
      enablePluralization = true,
      namespace,
      groupByNamespace = 'auto',
      exportPerNamespace = false,
    } = options;

    const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

    return this.request('/api/translate', {
      inputMethod: 'text',
      text,
      sourceLanguage,
      targetLanguages,
      outputFormat: 'json',
      preservePlaceholders,
      enablePluralization: enablePluralization ? 'true' : 'false',
      namespace,
      groupByNamespace,
      exportPerNamespace,
    });
  }

  /**
   * Translate plain text to multiple languages
   *
   * @example
   * ```typescript
   * const result = await shipi18n.translateText({
   *   content: 'Hello, world!',
   *   sourceLanguage: 'en',
   *   targetLanguages: ['es', 'fr'],
   * });
   * ```
   */
  async translateText(options: TranslateTextOptions): Promise<TranslationResult> {
    const {
      content,
      sourceLanguage,
      targetLanguages,
      preservePlaceholders = true,
    } = options;

    const text = Array.isArray(content) ? content.join('\n') : content;

    return this.request('/api/translate', {
      inputMethod: 'text',
      text,
      sourceLanguage,
      targetLanguages,
      outputFormat: 'text',
      preservePlaceholders,
    });
  }

  /**
   * Translate an i18next-style JSON file with full feature support
   *
   * @example
   * ```typescript
   * const result = await shipi18n.translateI18next({
   *   content: {
   *     common: { greeting: 'Hello' },
   *     checkout: { pay: 'Pay {{amount}}' }
   *   },
   *   sourceLanguage: 'en',
   *   targetLanguages: ['es', 'fr', 'de'],
   * });
   * ```
   */
  async translateI18next(options: TranslateJSONOptions): Promise<TranslationResult> {
    return this.translateJSON({
      ...options,
      preservePlaceholders: true,
      enablePluralization: true,
      groupByNamespace: 'auto',
    });
  }

  /**
   * Get available languages supported by the API
   */
  async getLanguages(): Promise<{ languages: Array<{ code: string; name: string }> }> {
    return this.request<{ languages: Array<{ code: string; name: string }> }>('/api/languages', {}, 'GET');
  }

  private async request<T = TranslationResult>(
    endpoint: string,
    body: Record<string, unknown>,
    method: 'GET' | 'POST' = 'POST'
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: method === 'POST' ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Shipi18nError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code || 'HTTP_ERROR'
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Shipi18nError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Shipi18nError('Request timed out', 408, 'TIMEOUT');
        }
        throw new Shipi18nError(error.message, 500, 'NETWORK_ERROR');
      }

      throw new Shipi18nError('Unknown error occurred', 500, 'UNKNOWN_ERROR');
    }
  }
}

// Default export for convenience
export default Shipi18n;
