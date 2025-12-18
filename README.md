# @shipi18n/api

[![npm version](https://img.shields.io/npm/v/@shipi18n/api)](https://www.npmjs.com/package/@shipi18n/api)
[![npm downloads](https://img.shields.io/npm/dw/@shipi18n/api)](https://www.npmjs.com/package/@shipi18n/api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub last commit](https://img.shields.io/github/last-commit/Shipi18n/shipi18n-api)](https://github.com/Shipi18n/shipi18n-api)
[![CI](https://github.com/Shipi18n/shipi18n-api/actions/workflows/ci.yml/badge.svg)](https://github.com/Shipi18n/shipi18n-api/actions)
[![codecov](https://codecov.io/gh/Shipi18n/shipi18n-api/branch/master/graph/badge.svg)](https://codecov.io/gh/Shipi18n/shipi18n-api)

Official Node.js client for the Shipi18n translation API. Translate JSON, text, and i18n files with a simple, type-safe API.

## Why Shipi18n?

- **Stop copy-pasting into Google Translate** - One API call translates to 100+ languages
- **Placeholders stay intact** - `{name}`, `{{count}}`, `%s` are preserved automatically
- **i18next-native** - Built-in pluralization, namespaces, ICU MessageFormat support
- **90-day Translation Memory** - Same content? Cached. No extra cost.
- **Key-based pricing** - Pay for unique strings, not characters or API calls

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
  baseUrl: 'https://ydjkwckq3f.execute-api.us-east-1.amazonaws.com', // Optional, default shown
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
  htmlHandling: 'none',            // 'none' | 'strip' | 'decode' | 'preserve'
  namespace: 'common',             // Optional: wrap output in namespace
  groupByNamespace: 'auto',        // 'auto' | 'true' | 'false'
  exportPerNamespace: false,       // Split output by namespace
  skipKeys: ['brandName'],         // Skip exact key paths from translation
  skipPaths: ['states.*'],         // Skip using glob patterns (*, **)
  contextAnnotations: {            // Context hints for ambiguous words
    'close': 'button - dismiss window',
    'address': 'form field - location',
  },
});
```

**HTML Handling Modes:**
| Mode | Description |
|------|-------------|
| `none` | Leave HTML as-is (default) |
| `strip` | Remove all HTML tags |
| `decode` | Decode HTML entities (`&amp;` → `&`) |
| `preserve` | Keep HTML tags and translate text between them |

### translateText(options)

Translate plain text to multiple languages.

```typescript
const result = await shipi18n.translateText({
  content: 'Hello, world!',        // String or string[]
  sourceLanguage: 'en',
  targetLanguages: ['es', 'fr'],
  preservePlaceholders: true,
  htmlHandling: 'none',            // 'none' | 'strip' | 'decode' | 'preserve'
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

### Fallback Options

Handle missing translations gracefully with built-in fallback support:

```typescript
const result = await shipi18n.translateJSON({
  content: { greeting: 'Hello', farewell: 'Goodbye' },
  sourceLanguage: 'en',
  targetLanguages: ['es', 'pt-BR', 'zh-TW'],
  fallback: {
    fallbackToSource: true,    // Use source content when translation missing (default: true)
    regionalFallback: true,    // pt-BR → pt, zh-TW → zh fallback (default: true)
    fallbackLanguage: 'en',    // Custom fallback language (optional)
  },
});

// If pt-BR translation fails, uses pt translation
// If pt also fails, uses English source content

// Check what fallbacks were used:
if (result.fallbackInfo?.used) {
  console.log(result.fallbackInfo.regionalFallbacks);      // { 'pt-BR': 'pt' }
  console.log(result.fallbackInfo.languagesFallbackToSource); // ['zh-TW']
  console.log(result.fallbackInfo.keysFallback);           // { es: ['farewell'] }
}
```

**Fallback behavior:**
| Scenario | Behavior |
|----------|----------|
| Missing translation for language | Falls back to regional variant (pt-BR → pt), then source |
| Missing translation for key | Fills key from source content |
| API error | Returns source content for all languages (if enabled) |

### Skipping Keys

Exclude specific keys or patterns from translation - useful for brand names, US state codes, or config values that should remain untranslated:

```typescript
const result = await shipi18n.translateJSON({
  content: {
    greeting: 'Hello',
    brandName: 'Acme Inc',           // Should stay as-is
    states: { CA: 'California', NY: 'New York' }, // State names
    config: { api: { secret: 'xyz' } },
  },
  sourceLanguage: 'en',
  targetLanguages: ['es', 'fr'],
  skipKeys: ['brandName', 'config.api.secret'],  // Exact paths
  skipPaths: ['states.*'],                        // Glob patterns
});

// Skipped keys are preserved in original language
// result.es.brandName === 'Acme Inc'
// result.es.states.CA === 'California'

// Check what was skipped:
if (result.skipped) {
  console.log(`Skipped ${result.skipped.count} keys:`, result.skipped.keys);
}
```

**Pattern Matching:**
| Pattern | Matches |
|---------|---------|
| `states.CA` | Exact path only |
| `states.*` | `states.CA`, `states.NY` (single level) |
| `config.*.secret` | `config.api.secret`, `config.db.secret` |
| `**.internal` | Any path ending with `.internal` |

### Context Annotations

Improve translation quality for ambiguous words by providing context hints:

```typescript
const result = await shipi18n.translateJSON({
  content: {
    close: 'Close',
    address: 'Address',
    greeting: 'Hello',
  },
  sourceLanguage: 'en',
  targetLanguages: ['es'],
  contextAnnotations: {
    'close': 'button - dismiss window',      // Not "nearby"
    'address': 'form field - physical location', // Not "to address someone"
  },
});

// Result: "close" → "Cerrar" (not "Cerca")
// Result: "address" → "Dirección" (not "Dirigirse")

// Check which keys used context:
if (result.contextEnhanced) {
  console.log(`${result.contextEnhanced.count} keys used context annotations`);
  console.log(result.contextEnhanced.keys); // ['close', 'address']
}
```

### Legal Content Warning

The API automatically warns when translating keys that may contain legal content:

```typescript
const result = await shipi18n.translateJSON({
  content: {
    terms_of_service: 'Terms of Service',
    privacy_policy: 'Privacy Policy',
    greeting: 'Hello',
  },
  sourceLanguage: 'en',
  targetLanguages: ['es'],
});

// Check for legal content warnings:
const legalWarning = result.warnings?.find(w => w.type === 'legal_content');
if (legalWarning) {
  console.warn(legalWarning.message);
  // "⚠️ Legal content detected (2 keys). Machine-translated legal text may not be legally binding."
  console.log(legalWarning.details.keys); // ['terms_of_service', 'privacy_policy']
}
```

**Detected patterns:** terms, privacy, disclaimer, legal, tos, eula, copyright, license, gdpr, cookie_policy, compliance, data_protection, refund, warranty

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

## Documentation & Resources

📚 **Full Documentation:** [shipi18n.com/integrations/nodejs-sdk](https://shipi18n.com/integrations/nodejs-sdk)

| Resource | Link |
|----------|------|
| **Getting Started** | [shipi18n.com](https://shipi18n.com) |
| **API Reference** | [shipi18n.com/api](https://shipi18n.com/api) |
| **i18next Best Practices** | [shipi18n.com/integrations/react](https://shipi18n.com/integrations/react) |
| **Blog & Tutorials** | [shipi18n.com/blog](https://shipi18n.com/blog) |

## Related Packages

| Package | Description |
|---------|-------------|
| [@shipi18n/cli](https://www.npmjs.com/package/@shipi18n/cli) | CLI tool for translating files |
| [vite-plugin-shipi18n](https://www.npmjs.com/package/vite-plugin-shipi18n) | Vite plugin for build-time translation |
| [i18next-shipi18n-backend](https://www.npmjs.com/package/i18next-shipi18n-backend) | i18next backend for dynamic loading |
| [shipi18n-github-action](https://github.com/marketplace/actions/shipi18n-auto-translate) | GitHub Action for CI/CD |

## Examples

- [Node.js Example](https://github.com/Shipi18n/shipi18n-nodejs-example) - Basic usage examples
- [Vue Example](https://github.com/Shipi18n/shipi18n-vue-example) - Vue 3 + vue-i18n integration

## License

MIT

---

<p align="center">
  <a href="https://shipi18n.com">shipi18n.com</a> ·
  <a href="https://github.com/Shipi18n">GitHub</a> ·
  <a href="https://shipi18n.com/pricing">Pricing</a>
</p>
