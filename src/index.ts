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
  /** API base URL (default: https://ydjkwckq3f.execute-api.us-east-1.amazonaws.com) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

export interface FallbackOptions {
  /** Use source language content when translation is missing (default: true) */
  fallbackToSource?: boolean;
  /** Enable regional fallback e.g., pt-BR → pt (default: true) */
  regionalFallback?: boolean;
  /** Custom fallback language code (overrides source language) */
  fallbackLanguage?: string;
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
  /** Fallback options for missing translations */
  fallback?: FallbackOptions;
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
  /** Fallback options for missing translations */
  fallback?: FallbackOptions;
}

export interface FallbackInfo {
  /** Whether any fallbacks were used */
  used: boolean;
  /** Languages that fell back to source */
  languagesFallbackToSource: string[];
  /** Regional fallbacks applied (e.g., { 'pt-BR': 'pt' }) */
  regionalFallbacks: Record<string, string>;
  /** Keys that used fallback values, by language */
  keysFallback: Record<string, string[]>;
}

export interface TranslationResult {
  /** Translations keyed by language code */
  [languageCode: string]: Record<string, unknown> | TranslationPair[] | TranslationWarning[] | NamespaceInfo | FallbackInfo | undefined;
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
    this.baseUrl = config.baseUrl || 'https://ydjkwckq3f.execute-api.us-east-1.amazonaws.com';
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
   *   fallback: { fallbackToSource: true, regionalFallback: true },
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
      fallback = {},
    } = options;

    const {
      fallbackToSource = true,
      regionalFallback = true,
      fallbackLanguage,
    } = fallback;

    const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    const sourceContent = typeof content === 'string' ? JSON.parse(content) : content;

    // Process regional fallbacks - separate base languages from regional variants
    const { processedTargets, regionalMap } = this.processRegionalLanguages(targetLanguages, regionalFallback);

    const result = await this.request<TranslationResult>('/api/translate', {
      inputMethod: 'text',
      text,
      sourceLanguage,
      targetLanguages: JSON.stringify(processedTargets),
      outputFormat: 'json',
      preservePlaceholders: String(preservePlaceholders),
      enablePluralization: enablePluralization ? 'true' : 'false',
      namespace,
      groupByNamespace,
      exportPerNamespace,
    });

    // Apply fallback logic
    return this.applyFallbacks(
      result,
      sourceContent,
      targetLanguages,
      sourceLanguage,
      fallbackToSource,
      regionalFallback,
      fallbackLanguage,
      regionalMap
    );
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
      targetLanguages: JSON.stringify(targetLanguages),
      outputFormat: 'text',
      preservePlaceholders: String(preservePlaceholders),
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

  /**
   * Process regional language codes and create a mapping for fallbacks
   * e.g., ['es', 'pt-BR', 'zh-TW'] -> { processedTargets: ['es', 'pt', 'zh'], regionalMap: { 'pt-BR': 'pt', 'zh-TW': 'zh' } }
   */
  private processRegionalLanguages(
    targetLanguages: string[],
    regionalFallback: boolean
  ): { processedTargets: string[]; regionalMap: Record<string, string> } {
    const regionalMap: Record<string, string> = {};
    const processedTargets: string[] = [];
    const baseLanguagesAdded = new Set<string>();

    for (const lang of targetLanguages) {
      if (lang.includes('-') && regionalFallback) {
        const baseLang = lang.split('-')[0];
        regionalMap[lang] = baseLang;

        // Add base language if not already in the list
        if (!baseLanguagesAdded.has(baseLang) && !targetLanguages.includes(baseLang)) {
          processedTargets.push(baseLang);
          baseLanguagesAdded.add(baseLang);
        }
      }

      // Always include the original language
      if (!processedTargets.includes(lang)) {
        processedTargets.push(lang);
      }
    }

    return { processedTargets, regionalMap };
  }

  /**
   * Apply fallback logic to translation results
   */
  private applyFallbacks(
    result: TranslationResult,
    sourceContent: Record<string, unknown>,
    targetLanguages: string[],
    sourceLanguage: string,
    fallbackToSource: boolean,
    regionalFallback: boolean,
    fallbackLanguage: string | undefined,
    regionalMap: Record<string, string>
  ): TranslationResult {
    const fallbackInfo: FallbackInfo = {
      used: false,
      languagesFallbackToSource: [],
      regionalFallbacks: {},
      keysFallback: {},
    };

    const effectiveFallbackLang = fallbackLanguage || sourceLanguage;

    for (const lang of targetLanguages) {
      const translation = result[lang] as Record<string, unknown> | undefined;

      // Case 1: Entire language missing - try regional fallback first, then source
      if (!translation || Object.keys(translation).length === 0) {
        // Try regional fallback (e.g., pt-BR -> pt)
        if (regionalFallback && regionalMap[lang]) {
          const baseLang = regionalMap[lang];
          const baseTranslation = result[baseLang] as Record<string, unknown> | undefined;

          if (baseTranslation && Object.keys(baseTranslation).length > 0) {
            result[lang] = { ...baseTranslation };
            fallbackInfo.used = true;
            fallbackInfo.regionalFallbacks[lang] = baseLang;
            continue;
          }
        }

        // Fall back to source language
        if (fallbackToSource) {
          result[lang] = { ...sourceContent };
          fallbackInfo.used = true;
          fallbackInfo.languagesFallbackToSource.push(lang);
        }
        continue;
      }

      // Case 2: Check for missing keys within the translation
      if (fallbackToSource && typeof translation === 'object') {
        const missingKeys = this.findMissingKeys(sourceContent, translation);

        if (missingKeys.length > 0) {
          fallbackInfo.used = true;
          fallbackInfo.keysFallback[lang] = missingKeys;

          // Fill in missing keys from regional fallback or source
          for (const key of missingKeys) {
            const fallbackValue = this.getNestedValue(sourceContent, key);

            // Try regional fallback first
            if (regionalFallback && regionalMap[lang]) {
              const baseLang = regionalMap[lang];
              const baseTranslation = result[baseLang] as Record<string, unknown> | undefined;
              const baseValue = baseTranslation ? this.getNestedValue(baseTranslation, key) : undefined;

              if (baseValue !== undefined) {
                this.setNestedValue(translation, key, baseValue);
                continue;
              }
            }

            // Fall back to source
            if (fallbackValue !== undefined) {
              this.setNestedValue(translation, key, fallbackValue);
            }
          }
        }
      }
    }

    // Add fallback info to result if any fallbacks were used
    if (fallbackInfo.used) {
      result.fallbackInfo = fallbackInfo;
    }

    return result;
  }

  /**
   * Find keys in source that are missing in translation
   */
  private findMissingKeys(
    source: Record<string, unknown>,
    translation: Record<string, unknown>,
    prefix = ''
  ): string[] {
    const missing: string[] = [];

    for (const key of Object.keys(source)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const sourceValue = source[key];
      const translationValue = translation[key];

      if (translationValue === undefined || translationValue === null || translationValue === '') {
        missing.push(fullKey);
      } else if (
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof translationValue === 'object' &&
        translationValue !== null
      ) {
        // Recurse into nested objects
        missing.push(
          ...this.findMissingKeys(
            sourceValue as Record<string, unknown>,
            translationValue as Record<string, unknown>,
            fullKey
          )
        );
      }
    }

    return missing;
  }

  /**
   * Get a nested value from an object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Set a nested value in an object using dot notation
   */
  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
  }
}

// Default export for convenience
export default Shipi18n;
