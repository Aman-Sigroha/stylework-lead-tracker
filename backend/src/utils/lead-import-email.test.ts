import { describe, expect, it } from 'vitest';
import { normalizeImportEmail } from './lead-import-email.js';

describe('normalizeImportEmail', () => {
  it('trims whitespace and lowercases email', () => {
    expect(normalizeImportEmail('  JOHN@Example.com  ')).toBe('john@example.com');
  });
});
