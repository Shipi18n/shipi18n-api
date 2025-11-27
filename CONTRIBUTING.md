# Contributing to @shipi18n/api

Thank you for your interest in contributing to the Shipi18n API client! This document provides guidelines and instructions for contributing.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Your environment (OS, Node version)
- Code snippet demonstrating the issue
- Error messages or stack traces

### Suggesting Enhancements

We welcome suggestions for new features or improvements! Please create an issue with:

- A clear description of the enhancement
- Why this would be useful
- Example use cases
- Any implementation ideas

### Pull Requests

1. **Fork the repository** and create your branch from `main`

```bash
git checkout -b feature/my-new-feature
```

2. **Make your changes**

   - Follow the existing code style
   - Add TypeScript types for new features
   - Add JSDoc comments for functions
   - Update documentation if needed

3. **Test your changes**

```bash
npm install
npm test
npm run build
```

4. **Commit your changes**

Use clear, descriptive commit messages:

```bash
git commit -m "feat: add retry logic for failed requests"
```

5. **Push to your fork**

```bash
git push origin feature/my-new-feature
```

6. **Open a Pull Request**

   - Describe what your PR does
   - Reference any related issues
   - Include usage examples

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Export proper types for public APIs
- Use clear, descriptive variable names
- Add JSDoc comments for public functions
- Handle errors gracefully

**Example:**

```typescript
/**
 * Translate text to multiple languages
 * @param options - Translation options
 * @returns Promise resolving to translations
 */
export async function translate(options: TranslateOptions): Promise<TranslationResult> {
  const { text, targetLanguages, apiKey } = options

  if (!apiKey) {
    throw new Error('API key is required')
  }

  try {
    const response = await fetch('https://api.shipi18n.com/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ text, targetLanguages })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    throw new Error(`Translation failed: ${error.message}`)
  }
}
```

### API Design

- Keep the API simple and intuitive
- Provide sensible defaults
- Validate inputs
- Return consistent response formats
- Handle errors with helpful messages

### File Organization

```
shipi18n-api/
├── src/
│   ├── index.ts         # Main exports
│   ├── client.ts        # API client
│   └── types.ts         # TypeScript types
├── dist/                # Built files (generated)
└── __tests__/           # Jest tests
```

## Development Setup

### Prerequisites

- Node.js 16+
- npm
- A Shipi18n API key (for testing)

### Local Development

1. Clone your fork

```bash
git clone https://github.com/YOUR_USERNAME/shipi18n-api.git
cd shipi18n-api
```

2. Install dependencies

```bash
npm install
```

3. Build the package

```bash
npm run build
```

4. Link locally for testing

```bash
npm link
```

5. Test in another project

```bash
cd /path/to/your/project
npm link @shipi18n/api
```

## Testing

Before submitting a PR:

1. Run the full test suite

```bash
npm test
```

2. Test the build

```bash
npm run build
```

3. Verify TypeScript types

```bash
npx tsc --noEmit
```

4. Test manually in a Node.js project

```javascript
const { translate } = require('@shipi18n/api')

translate({
  apiKey: 'your_key',
  text: 'Hello',
  targetLanguages: ['es', 'fr']
}).then(console.log)
```

### Writing Tests

We use Jest for testing. Example test:

```typescript
import { translate } from '../src/index'

describe('translate', () => {
  it('should translate text', async () => {
    const result = await translate({
      apiKey: process.env.SHIPI18N_API_KEY,
      text: 'Hello',
      targetLanguages: ['es']
    })

    expect(result).toHaveProperty('es')
    expect(result.es[0].translated).toBeTruthy()
  })

  it('should throw error without API key', async () => {
    await expect(translate({
      text: 'Hello',
      targetLanguages: ['es']
    })).rejects.toThrow('API key is required')
  })
})
```

## Documentation

If you add new features:

- Update README.md with usage examples
- Add TypeScript JSDoc comments
- Update type definitions
- Include code examples

## Publishing (Maintainers Only)

To publish a new version:

1. Update version in `package.json`

```bash
npm version patch  # or minor, major
```

2. Build and test

```bash
npm run build
npm test
```

3. Publish to npm

```bash
npm publish
```

## Questions?

- Open an issue for questions
- Check existing issues and PRs
- Read the [Shipi18n documentation](https://shipi18n.com/docs)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Keep discussions focused and professional

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to @shipi18n/api! 🎉
