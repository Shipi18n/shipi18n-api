# @shipi18n/api

[![npm version](https://img.shields.io/npm/v/@shipi18n/api)](https://www.npmjs.com/package/@shipi18n/api)
[![npm downloads](https://img.shields.io/npm/dw/@shipi18n/api)](https://www.npmjs.com/package/@shipi18n/api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub last commit](https://img.shields.io/github/last-commit/Shipi18n/shipi18n-api)](https://github.com/Shipi18n/shipi18n-api)
[![CI](https://github.com/Shipi18n/shipi18n-api/actions/workflows/ci.yml/badge.svg)](https://github.com/Shipi18n/shipi18n-api/actions)
[![codecov](https://codecov.io/gh/Shipi18n/shipi18n-api/branch/master/graph/badge.svg)](https://codecov.io/gh/Shipi18n/shipi18n-api)

Official Node.js client for the Shipi18n translation API. Translate JSON, text, and i18n files with a simple, type-safe API.

## Installation

```bash
npm install @shipi18n/api
```

## Quick Start

```typescript
import { Shipi18n } from '@shipi18n/api';

const shipi18n = new Shipi18n({
  apiKey: 'your-api-key', // Get your API key at https://shipi18n.com
});

// Translate JSON
const result = await shipi18n.translateJSON({
  content: {
    greeting: 'Hello',
    farewell: 'Goodbye',
  },
  sourceLanguage: 'en',
  targetLanguages: ['es', 'fr', 'de'],
});

console.log(result.es); // { greeting: 'Hola', farewell: 'Adiós' }
console.log(result.fr); // { greeting: 'Bonjour', farewell: 'Au revoir' }
console.log(result.de); // { greeting: 'Hallo', farewell: 'Auf Wiedersehen' }
```

## Features

- **JSON Translation** - Translate nested JSON objects while preserving structure
- **Placeholder Preservation** - Keeps `{name}`, `{{count}}`, `%s` placeholders intact
- **i18next Support** - Full support for pluralization, namespaces, and ICU MessageFormat
- **TypeScript** - Full type definitions included
- **Zero Dependencies** - Uses native fetch (Node.js 18+)

## API Reference

### Constructor

```typescript
const shipi18n = new Shipi18n({
  apiKey: 'your-api-key',     // Required
  baseUrl: 'https://api.shipi18n.com', // Optional, default shown
  timeout: 30000,             // Optional, request timeout in ms
});
```

### translateJSON(options)

Translate JSON content to multiple languages.

```typescript
const result = await shipi18n.translateJSON({
  content: { greeting: 'Hello' },  // Object or JSON string
  sourceLanguage: 'en',
  targetLanguages: ['es', 'fr'],
  preservePlaceholders: true,      // Default: true
  enablePluralization: true,       // Default: true (i18next-style)
  namespace: 'common',             // Optional: wrap output in namespace
  groupByNamespace: 'auto',        // 'auto' | 'true' | 'false'
  exportPerNamespace: false,       // Split output by namespace
});
```

### translateText(options)

Translate plain text to multiple languages.

```typescript
const result = await shipi18n.translateText({
  content: 'Hello, world!',        // String or string[]
  sourceLanguage: 'en',
  targetLanguages: ['es', 'fr'],
  preservePlaceholders: true,
});

// result.es = [{ original: 'Hello, world!', translated: '¡Hola, mundo!' }]
```

### translateI18next(options)

Convenience method for i18next files with all features enabled.

```typescript
const result = await shipi18n.translateI18next({
  content: {
    common: {
      greeting: 'Hello, {{name}}!',
      items_one: '{{count}} item',
      items_other: '{{count}} items',
    },
  },
  sourceLanguage: 'en',
  targetLanguages: ['es', 'fr', 'de'],
});
```

## Examples

### Nested JSON with Namespaces

```typescript
const result = await shipi18n.translateJSON({
  content: {
    common: {
      buttons: {
        submit: 'Submit',
        cancel: 'Cancel',
      },
    },
    checkout: {
      total: 'Total: {{amount}}',
      pay: 'Pay Now',
    },
  },
  sourceLanguage: 'en',
  targetLanguages: ['es'],
});

// Namespaces are auto-detected and preserved
console.log(result.es);
// {
//   common: { buttons: { submit: 'Enviar', cancel: 'Cancelar' } },
//   checkout: { total: 'Total: {{amount}}', pay: 'Pagar ahora' }
// }
```

### Pluralization (i18next-style)

```typescript
const result = await shipi18n.translateJSON({
  content: {
    items_one: '{{count}} item',
    items_other: '{{count}} items',
  },
  sourceLanguage: 'en',
  targetLanguages: ['ru'], // Russian has more plural forms
});

// Automatically generates correct plural forms for each language
console.log(result.ru);
// {
//   items_one: '{{count}} элемент',
//   items_few: '{{count}} элемента',
//   items_many: '{{count}} элементов',
//   items_other: '{{count}} элементов'
// }
```

### ICU MessageFormat

```typescript
const result = await shipi18n.translateJSON({
  content: {
    welcome: '{gender, select, male {Welcome, Mr. {name}} female {Welcome, Ms. {name}} other {Welcome, {name}}}',
  },
  sourceLanguage: 'en',
  targetLanguages: ['es'],
});

// ICU syntax is preserved, only translatable text is translated
```

### Export Per Namespace (for separate files)

```typescript
const result = await shipi18n.translateJSON({
  content: {
    common: { greeting: 'Hello' },
    checkout: { pay: 'Pay' },
  },
  sourceLanguage: 'en',
  targetLanguages: ['es', 'fr'],
  exportPerNamespace: true,
});

// result.namespaceFiles contains pre-split translations:
// {
//   common: { es: { greeting: 'Hola' }, fr: { greeting: 'Bonjour' } },
//   checkout: { es: { pay: 'Pagar' }, fr: { pay: 'Payer' } }
// }

// result.namespaceFileNames suggests file names:
// [
//   { namespace: 'common', files: ['common.es.json', 'common.fr.json'] },
//   { namespace: 'checkout', files: ['checkout.es.json', 'checkout.fr.json'] }
// ]
```

## Error Handling

```typescript
import { Shipi18n, Shipi18nError } from '@shipi18n/api';

try {
  const result = await shipi18n.translateJSON({ ... });
} catch (error) {
  if (error instanceof Shipi18nError) {
    console.error(`Error ${error.statusCode}: ${error.message}`);
    console.error(`Code: ${error.code}`);
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `MISSING_API_KEY` | API key not provided |
| `INVALID_API_KEY` | API key is invalid |
| `QUOTA_EXCEEDED` | Monthly character limit reached |
| `RATE_LIMITED` | Too many requests |
| `TIMEOUT` | Request timed out |
| `NETWORK_ERROR` | Network connection failed |

## Supported Languages

Over 100 languages supported. Common codes:

| Code | Language |
|------|----------|
| `en` | English |
| `es` | Spanish |
| `fr` | French |
| `de` | German |
| `it` | Italian |
| `pt` | Portuguese |
| `zh` | Chinese |
| `ja` | Japanese |
| `ko` | Korean |
| `ar` | Arabic |
| `ru` | Russian |
| `hi` | Hindi |

## Get Your API Key

1. Sign up at [shipi18n.com](https://shipi18n.com)
2. Go to Dashboard > API Keys
3. Generate a new API key

## Related Packages

- [@shipi18n/cli](https://www.npmjs.com/package/@shipi18n/cli) - CLI tool for translating files
- [vite-plugin-shipi18n](https://www.npmjs.com/package/vite-plugin-shipi18n) - Vite plugin for build-time translation

## License

MIT
