import { Shipi18n, Shipi18nError } from '../index';

describe('Shipi18n', () => {
  describe('constructor', () => {
    it('throws error when API key is missing', () => {
      expect(() => new Shipi18n({ apiKey: '' })).toThrow(Shipi18nError);
      expect(() => new Shipi18n({ apiKey: '' })).toThrow('API key is required');
    });

    it('creates instance with valid API key', () => {
      const client = new Shipi18n({ apiKey: 'test-key' });
      expect(client).toBeInstanceOf(Shipi18n);
    });

    it('uses default baseUrl', () => {
      const client = new Shipi18n({ apiKey: 'test-key' });
      expect(client['baseUrl']).toBe('https://api.shipi18n.com');
    });

    it('allows custom baseUrl', () => {
      const client = new Shipi18n({
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com',
      });
      expect(client['baseUrl']).toBe('https://custom.api.com');
    });

    it('uses default timeout', () => {
      const client = new Shipi18n({ apiKey: 'test-key' });
      expect(client['timeout']).toBe(30000);
    });

    it('allows custom timeout', () => {
      const client = new Shipi18n({
        apiKey: 'test-key',
        timeout: 60000,
      });
      expect(client['timeout']).toBe(60000);
    });
  });

  describe('Shipi18nError', () => {
    it('creates error with correct properties', () => {
      const error = new Shipi18nError('Test error', 400, 'TEST_CODE');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('Shipi18nError');
    });

    it('uses default code when not provided', () => {
      const error = new Shipi18nError('Test error', 500);
      expect(error.code).toBe('API_ERROR');
    });
  });
});

describe('translateJSON options validation', () => {
  let client: Shipi18n;

  beforeEach(() => {
    client = new Shipi18n({ apiKey: 'test-key' });
    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('accepts object content', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ es: { greeting: 'Hola' } }),
    });

    await client.translateJSON({
      content: { greeting: 'Hello' },
      sourceLanguage: 'en',
      targetLanguages: ['es'],
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.text).toBe('{\n  "greeting": "Hello"\n}');
  });

  it('accepts string content', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ es: { greeting: 'Hola' } }),
    });

    await client.translateJSON({
      content: '{"greeting": "Hello"}',
      sourceLanguage: 'en',
      targetLanguages: ['es'],
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.text).toBe('{"greeting": "Hello"}');
  });

  it('sends correct headers', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ es: {} }),
    });

    await client.translateJSON({
      content: {},
      sourceLanguage: 'en',
      targetLanguages: ['es'],
    });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.headers['x-api-key']).toBe('test-key');
  });
});

describe('translateText', () => {
  let client: Shipi18n;

  beforeEach(() => {
    client = new Shipi18n({ apiKey: 'test-key' });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('translates single text string', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        es: [{ original: 'Hello', translated: 'Hola' }],
      }),
    });

    const result = await client.translateText({
      content: 'Hello',
      sourceLanguage: 'en',
      targetLanguages: ['es'],
    });

    expect(result.es).toEqual([{ original: 'Hello', translated: 'Hola' }]);
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.text).toBe('Hello');
    expect(body.outputFormat).toBe('text');
  });

  it('translates array of texts', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        es: [
          { original: 'Hello', translated: 'Hola' },
          { original: 'Goodbye', translated: 'Adiós' },
        ],
      }),
    });

    const result = await client.translateText({
      content: ['Hello', 'Goodbye'],
      sourceLanguage: 'en',
      targetLanguages: ['es'],
    });

    expect(result.es).toHaveLength(2);
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.text).toBe('Hello\nGoodbye');
  });

  it('preserves placeholders by default', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ es: [] }),
    });

    await client.translateText({
      content: 'Hello {{name}}',
      sourceLanguage: 'en',
      targetLanguages: ['es'],
    });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.preservePlaceholders).toBe(true);
  });

  it('allows disabling placeholder preservation', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ es: [] }),
    });

    await client.translateText({
      content: 'Hello {{name}}',
      sourceLanguage: 'en',
      targetLanguages: ['es'],
      preservePlaceholders: false,
    });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.preservePlaceholders).toBe(false);
  });
});

describe('translateI18next', () => {
  let client: Shipi18n;

  beforeEach(() => {
    client = new Shipi18n({ apiKey: 'test-key' });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('calls translateJSON with i18next defaults', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ es: { greeting: 'Hola' } }),
    });

    await client.translateI18next({
      content: { greeting: 'Hello' },
      sourceLanguage: 'en',
      targetLanguages: ['es'],
    });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.preservePlaceholders).toBe(true);
    expect(body.enablePluralization).toBe('true');
    expect(body.groupByNamespace).toBe('auto');
  });

  it('overrides user options with i18next defaults', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ es: {} }),
    });

    await client.translateI18next({
      content: {},
      sourceLanguage: 'en',
      targetLanguages: ['es'],
      preservePlaceholders: false, // Should be overridden to true
      enablePluralization: false, // Should be overridden to true
    });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.preservePlaceholders).toBe(true);
    expect(body.enablePluralization).toBe('true');
  });
});

describe('getLanguages', () => {
  let client: Shipi18n;

  beforeEach(() => {
    client = new Shipi18n({ apiKey: 'test-key' });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('fetches available languages', async () => {
    const mockLanguages = {
      languages: [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockLanguages),
    });

    const result = await client.getLanguages();

    expect(result.languages).toHaveLength(3);
    expect(result.languages[0]).toEqual({ code: 'en', name: 'English' });
  });

  it('uses GET method', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ languages: [] }),
    });

    await client.getLanguages();

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.method).toBe('GET');
    expect(options.body).toBeUndefined();
  });
});

describe('Error handling', () => {
  let client: Shipi18n;

  beforeEach(() => {
    client = new Shipi18n({ apiKey: 'test-key' });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('handles API error response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({
        message: 'Invalid API key',
        code: 'INVALID_API_KEY',
      }),
    });

    await expect(
      client.translateJSON({
        content: {},
        sourceLanguage: 'en',
        targetLanguages: ['es'],
      })
    ).rejects.toThrow('Invalid API key');
  });

  it('handles API error when json parsing fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    await expect(
      client.translateJSON({
        content: {},
        sourceLanguage: 'en',
        targetLanguages: ['es'],
      })
    ).rejects.toThrow('HTTP 500: Internal Server Error');
  });

  it('uses HTTP_ERROR code when API error has no code', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ message: 'Bad request' }),
    });

    try {
      await client.translateJSON({
        content: {},
        sourceLanguage: 'en',
        targetLanguages: ['es'],
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Shipi18nError);
      expect((error as Shipi18nError).code).toBe('HTTP_ERROR');
    }
  });

  it('handles timeout error', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';

    (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);

    try {
      await client.translateJSON({
        content: {},
        sourceLanguage: 'en',
        targetLanguages: ['es'],
      });
      fail('Expected error to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Shipi18nError);
      expect((error as Shipi18nError).message).toBe('Request timed out');
      expect((error as Shipi18nError).code).toBe('TIMEOUT');
      expect((error as Shipi18nError).statusCode).toBe(408);
    }
  });

  it('handles network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

    await expect(
      client.translateJSON({
        content: {},
        sourceLanguage: 'en',
        targetLanguages: ['es'],
      })
    ).rejects.toThrow('Network failure');

    try {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'));
      await client.translateJSON({
        content: {},
        sourceLanguage: 'en',
        targetLanguages: ['es'],
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Shipi18nError);
      expect((error as Shipi18nError).code).toBe('NETWORK_ERROR');
      expect((error as Shipi18nError).statusCode).toBe(500);
    }
  });

  it('handles unknown error type', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce('String error');

    try {
      await client.translateJSON({
        content: {},
        sourceLanguage: 'en',
        targetLanguages: ['es'],
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Shipi18nError);
      expect((error as Shipi18nError).message).toBe('Unknown error occurred');
      expect((error as Shipi18nError).code).toBe('UNKNOWN_ERROR');
    }
  });

  it('re-throws Shipi18nError as-is', async () => {
    const originalError = new Shipi18nError('Custom error', 422, 'CUSTOM_CODE');

    (global.fetch as jest.Mock).mockRejectedValueOnce(originalError);

    try {
      await client.translateJSON({
        content: {},
        sourceLanguage: 'en',
        targetLanguages: ['es'],
      });
    } catch (error) {
      expect(error).toBe(originalError);
      expect((error as Shipi18nError).message).toBe('Custom error');
      expect((error as Shipi18nError).code).toBe('CUSTOM_CODE');
    }
  });
});

describe('translateJSON advanced options', () => {
  let client: Shipi18n;

  beforeEach(() => {
    client = new Shipi18n({ apiKey: 'test-key' });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('sends namespace option', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ es: {} }),
    });

    await client.translateJSON({
      content: { greeting: 'Hello' },
      sourceLanguage: 'en',
      targetLanguages: ['es'],
      namespace: 'common',
    });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.namespace).toBe('common');
  });

  it('sends groupByNamespace option', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ es: {} }),
    });

    await client.translateJSON({
      content: {},
      sourceLanguage: 'en',
      targetLanguages: ['es'],
      groupByNamespace: 'true',
    });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.groupByNamespace).toBe('true');
  });

  it('sends exportPerNamespace option', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ es: {} }),
    });

    await client.translateJSON({
      content: {},
      sourceLanguage: 'en',
      targetLanguages: ['es'],
      exportPerNamespace: true,
    });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.exportPerNamespace).toBe(true);
  });

  it('disables pluralization when specified', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ es: {} }),
    });

    await client.translateJSON({
      content: {},
      sourceLanguage: 'en',
      targetLanguages: ['es'],
      enablePluralization: false,
    });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.enablePluralization).toBe('false');
  });
});

describe('Fallback language strategy', () => {
  let client: Shipi18n;

  beforeEach(() => {
    client = new Shipi18n({ apiKey: 'test-key' });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('fallbackToSource', () => {
    it('uses source content when translation for language is missing', async () => {
      const sourceContent = { greeting: 'Hello', farewell: 'Goodbye' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          es: { greeting: 'Hola', farewell: 'Adiós' },
          // fr is missing entirely
        }),
      });

      const result = await client.translateJSON({
        content: sourceContent,
        sourceLanguage: 'en',
        targetLanguages: ['es', 'fr'],
        fallback: { fallbackToSource: true },
      });

      expect(result.es).toEqual({ greeting: 'Hola', farewell: 'Adiós' });
      expect(result.fr).toEqual(sourceContent);
      expect(result.fallbackInfo).toBeDefined();
      expect((result.fallbackInfo as any).languagesFallbackToSource).toContain('fr');
    });

    it('fills missing keys from source content', async () => {
      const sourceContent = { greeting: 'Hello', farewell: 'Goodbye', title: 'Welcome' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          es: { greeting: 'Hola' }, // farewell and title are missing
        }),
      });

      const result = await client.translateJSON({
        content: sourceContent,
        sourceLanguage: 'en',
        targetLanguages: ['es'],
        fallback: { fallbackToSource: true },
      });

      expect(result.es).toEqual({
        greeting: 'Hola',
        farewell: 'Goodbye', // filled from source
        title: 'Welcome', // filled from source
      });
      expect((result.fallbackInfo as any).keysFallback.es).toContain('farewell');
      expect((result.fallbackInfo as any).keysFallback.es).toContain('title');
    });

    it('handles nested objects with missing keys', async () => {
      const sourceContent = {
        common: { greeting: 'Hello', farewell: 'Goodbye' },
        checkout: { pay: 'Pay now', cancel: 'Cancel' },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          es: {
            common: { greeting: 'Hola' }, // farewell missing
            checkout: { pay: 'Pagar ahora' }, // cancel missing
          },
        }),
      });

      const result = await client.translateJSON({
        content: sourceContent,
        sourceLanguage: 'en',
        targetLanguages: ['es'],
        fallback: { fallbackToSource: true },
      });

      expect((result.es as any).common.farewell).toBe('Goodbye');
      expect((result.es as any).checkout.cancel).toBe('Cancel');
    });

    it('does not add fallbackInfo when no fallbacks used', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          es: { greeting: 'Hola', farewell: 'Adiós' },
        }),
      });

      const result = await client.translateJSON({
        content: { greeting: 'Hello', farewell: 'Goodbye' },
        sourceLanguage: 'en',
        targetLanguages: ['es'],
        fallback: { fallbackToSource: true },
      });

      expect(result.fallbackInfo).toBeUndefined();
    });

    it('respects fallbackToSource: false option', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          es: { greeting: 'Hola' },
          // fr is missing
        }),
      });

      const result = await client.translateJSON({
        content: { greeting: 'Hello', farewell: 'Goodbye' },
        sourceLanguage: 'en',
        targetLanguages: ['es', 'fr'],
        fallback: { fallbackToSource: false },
      });

      expect(result.es).toEqual({ greeting: 'Hola' });
      expect(result.fr).toBeUndefined();
    });
  });

  describe('regionalFallback', () => {
    it('falls back pt-BR to pt when pt-BR is missing', async () => {
      const sourceContent = { greeting: 'Hello' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          pt: { greeting: 'Olá' },
          // pt-BR is missing, should fall back to pt
        }),
      });

      const result = await client.translateJSON({
        content: sourceContent,
        sourceLanguage: 'en',
        targetLanguages: ['pt-BR'],
        fallback: { regionalFallback: true },
      });

      expect(result['pt-BR']).toEqual({ greeting: 'Olá' });
      expect((result.fallbackInfo as any).regionalFallbacks['pt-BR']).toBe('pt');
    });

    it('handles zh-TW falling back to zh', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          zh: { greeting: '你好' },
        }),
      });

      const result = await client.translateJSON({
        content: { greeting: 'Hello' },
        sourceLanguage: 'en',
        targetLanguages: ['zh-TW'],
        fallback: { regionalFallback: true },
      });

      expect(result['zh-TW']).toEqual({ greeting: '你好' });
    });

    it('adds base language to API request when regional variant requested', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          pt: { greeting: 'Olá' },
          'pt-BR': { greeting: 'Olá BR' },
        }),
      });

      await client.translateJSON({
        content: { greeting: 'Hello' },
        sourceLanguage: 'en',
        targetLanguages: ['pt-BR'],
        fallback: { regionalFallback: true },
      });

      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.targetLanguages).toContain('pt');
      expect(body.targetLanguages).toContain('pt-BR');
    });

    it('does not duplicate base language if already in target list', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          pt: { greeting: 'Olá' },
          'pt-BR': { greeting: 'Olá BR' },
        }),
      });

      await client.translateJSON({
        content: { greeting: 'Hello' },
        sourceLanguage: 'en',
        targetLanguages: ['pt', 'pt-BR'],
        fallback: { regionalFallback: true },
      });

      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(options.body);
      const ptCount = body.targetLanguages.filter((l: string) => l === 'pt').length;
      expect(ptCount).toBe(1);
    });

    it('respects regionalFallback: false option', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          pt: { greeting: 'Olá' },
        }),
      });

      const result = await client.translateJSON({
        content: { greeting: 'Hello' },
        sourceLanguage: 'en',
        targetLanguages: ['pt-BR'],
        fallback: { regionalFallback: false, fallbackToSource: false },
      });

      // pt-BR should be missing (no regional fallback, no source fallback)
      expect(result['pt-BR']).toBeUndefined();
    });
  });

  describe('fallbackLanguage option', () => {
    it('uses custom fallback language instead of source', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          es: { greeting: 'Hola' },
          // fr missing
        }),
      });

      const result = await client.translateJSON({
        content: { greeting: 'Hello' },
        sourceLanguage: 'en',
        targetLanguages: ['es', 'fr'],
        fallback: {
          fallbackToSource: true,
          fallbackLanguage: 'en',
        },
      });

      // fr should fall back to source content
      expect(result.fr).toEqual({ greeting: 'Hello' });
    });
  });

  describe('combined fallback scenarios', () => {
    it('tries regional fallback before source fallback', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          pt: { greeting: 'Olá' },
          // pt-BR missing - should use pt, not source
        }),
      });

      const result = await client.translateJSON({
        content: { greeting: 'Hello' },
        sourceLanguage: 'en',
        targetLanguages: ['pt-BR'],
        fallback: { fallbackToSource: true, regionalFallback: true },
      });

      expect(result['pt-BR']).toEqual({ greeting: 'Olá' });
      expect((result.fallbackInfo as any).regionalFallbacks['pt-BR']).toBe('pt');
      expect((result.fallbackInfo as any).languagesFallbackToSource).not.toContain('pt-BR');
    });

    it('falls back to source when regional also missing', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          // Both pt and pt-BR missing
        }),
      });

      const result = await client.translateJSON({
        content: { greeting: 'Hello' },
        sourceLanguage: 'en',
        targetLanguages: ['pt-BR'],
        fallback: { fallbackToSource: true, regionalFallback: true },
      });

      expect(result['pt-BR']).toEqual({ greeting: 'Hello' });
      expect((result.fallbackInfo as any).languagesFallbackToSource).toContain('pt-BR');
    });

    it('handles multiple languages with different fallback scenarios', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          es: { greeting: 'Hola', farewell: 'Adiós' }, // complete
          fr: { greeting: 'Bonjour' }, // missing farewell
          pt: { greeting: 'Olá', farewell: 'Adeus' }, // complete (for pt-BR fallback)
          // de missing entirely
          // pt-BR missing but pt exists
        }),
      });

      const result = await client.translateJSON({
        content: { greeting: 'Hello', farewell: 'Goodbye' },
        sourceLanguage: 'en',
        targetLanguages: ['es', 'fr', 'de', 'pt-BR'],
        fallback: { fallbackToSource: true, regionalFallback: true },
      });

      // es: complete translation
      expect(result.es).toEqual({ greeting: 'Hola', farewell: 'Adiós' });

      // fr: missing key filled from source
      expect(result.fr).toEqual({ greeting: 'Bonjour', farewell: 'Goodbye' });

      // de: entire language falls back to source
      expect(result.de).toEqual({ greeting: 'Hello', farewell: 'Goodbye' });

      // pt-BR: regional fallback to pt
      expect(result['pt-BR']).toEqual({ greeting: 'Olá', farewell: 'Adeus' });

      // Verify fallback info
      const fallbackInfo = result.fallbackInfo as any;
      expect(fallbackInfo.used).toBe(true);
      expect(fallbackInfo.keysFallback.fr).toContain('farewell');
      expect(fallbackInfo.languagesFallbackToSource).toContain('de');
      expect(fallbackInfo.regionalFallbacks['pt-BR']).toBe('pt');
    });
  });

  describe('default fallback behavior', () => {
    it('enables fallbackToSource by default', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await client.translateJSON({
        content: { greeting: 'Hello' },
        sourceLanguage: 'en',
        targetLanguages: ['es'],
        // No fallback option specified - should use defaults
      });

      expect(result.es).toEqual({ greeting: 'Hello' });
    });

    it('enables regionalFallback by default', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          pt: { greeting: 'Olá' },
        }),
      });

      const result = await client.translateJSON({
        content: { greeting: 'Hello' },
        sourceLanguage: 'en',
        targetLanguages: ['pt-BR'],
        // No fallback option specified - should use defaults
      });

      expect(result['pt-BR']).toEqual({ greeting: 'Olá' });
    });
  });
});
