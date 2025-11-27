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
