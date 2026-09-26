import { describe, expect, it } from 'vitest';
import { buildLeadsQueryString } from './build-leads-query.js';

describe('buildLeadsQueryString', () => {
  it('omits page and limit when pagination is disabled', () => {
    expect(
      buildLeadsQueryString(
        { search: 'jane', page: 2, limit: 50, sortBy: 'name', sortOrder: 'asc' },
        { includePagination: false },
      ),
    ).toBe('?search=jane&sortBy=name&sortOrder=asc');
  });

  it('includes page and limit by default', () => {
    expect(buildLeadsQueryString({ page: 2, limit: 50 })).toBe(
      '?page=2&limit=50',
    );
  });
});
