import { Shipi18n, Shipi18nError, TranslateJSONOptions } from '../index'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

describe('Shipi18n Skip Options', () => {
  let client: Shipi18n

  beforeEach(() => {
    client = new Shipi18n({ apiKey: 'test-api-key' })
    jest.clearAllMocks()
  })

  describe('translateJSON with skipKeys and skipPaths', () => {
    test('sends skipKeys to API', async () => {
      const mockResponse = {
        es: { greeting: 'Hola' },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await client.translateJSON({
        content: { greeting: 'Hello', brandName: 'Acme' },
        sourceLanguage: 'en',
        targetLanguages: ['es'],
        skipKeys: ['brandName'],
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)

      const [url, options] = mockFetch.mock.calls[0]
      const body = JSON.parse(options.body)

      expect(body.skipKeys).toEqual(['brandName'])
    })

    test('sends skipPaths to API', async () => {
      const mockResponse = {
        es: { greeting: 'Hola' },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await client.translateJSON({
        content: { greeting: 'Hello', states: { CA: 'California' } },
        sourceLanguage: 'en',
        targetLanguages: ['es'],
        skipPaths: ['states.*', 'config.*.secret'],
      })

      const [url, options] = mockFetch.mock.calls[0]
      const body = JSON.parse(options.body)

      expect(body.skipPaths).toEqual(['states.*', 'config.*.secret'])
    })

    test('sends both skipKeys and skipPaths together', async () => {
      const mockResponse = {
        es: { greeting: 'Hola' },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await client.translateJSON({
        content: { greeting: 'Hello' },
        sourceLanguage: 'en',
        targetLanguages: ['es'],
        skipKeys: ['brandName', 'company.name'],
        skipPaths: ['states.*', '*.internal'],
      })

      const [url, options] = mockFetch.mock.calls[0]
      const body = JSON.parse(options.body)

      expect(body.skipKeys).toEqual(['brandName', 'company.name'])
      expect(body.skipPaths).toEqual(['states.*', '*.internal'])
    })

    test('sends empty arrays when skip options not provided', async () => {
      const mockResponse = {
        es: { greeting: 'Hola' },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await client.translateJSON({
        content: { greeting: 'Hello' },
        sourceLanguage: 'en',
        targetLanguages: ['es'],
      })

      const [url, options] = mockFetch.mock.calls[0]
      const body = JSON.parse(options.body)

      expect(body.skipKeys).toEqual([])
      expect(body.skipPaths).toEqual([])
    })

    test('preserves skipped info in response', async () => {
      const mockResponse = {
        es: { greeting: 'Hola' },
        skipped: {
          count: 3,
          keys: ['brandName', 'states.CA', 'states.NY'],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.translateJSON({
        content: { greeting: 'Hello' },
        sourceLanguage: 'en',
        targetLanguages: ['es'],
        skipKeys: ['brandName'],
        skipPaths: ['states.*'],
      })

      expect(result.skipped).toEqual({
        count: 3,
        keys: ['brandName', 'states.CA', 'states.NY'],
      })
    })
  })

  describe('TypeScript interface validation', () => {
    test('skipKeys accepts string array', () => {
      const options: TranslateJSONOptions = {
        content: { greeting: 'Hello' },
        sourceLanguage: 'en',
        targetLanguages: ['es'],
        skipKeys: ['key1', 'key2', 'nested.key'],
      }

      expect(options.skipKeys).toHaveLength(3)
    })

    test('skipPaths accepts glob pattern strings', () => {
      const options: TranslateJSONOptions = {
        content: { greeting: 'Hello' },
        sourceLanguage: 'en',
        targetLanguages: ['es'],
        skipPaths: ['states.*', 'config.*.secret', '**.internal'],
      }

      expect(options.skipPaths).toHaveLength(3)
    })

    test('skip options are optional', () => {
      const options: TranslateJSONOptions = {
        content: { greeting: 'Hello' },
        sourceLanguage: 'en',
        targetLanguages: ['es'],
      }

      expect(options.skipKeys).toBeUndefined()
      expect(options.skipPaths).toBeUndefined()
    })
  })
})

describe('Shipi18n Error Handling', () => {
  let client: Shipi18n

  beforeEach(() => {
    client = new Shipi18n({ apiKey: 'test-api-key' })
    jest.clearAllMocks()
  })

  test('throws Shipi18nError on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Invalid API key' }),
    })

    await expect(
      client.translateJSON({
        content: { greeting: 'Hello' },
        sourceLanguage: 'en',
        targetLanguages: ['es'],
      })
    ).rejects.toThrow(Shipi18nError)
  })
})
