import { z } from 'zod';
import {
  LEAD_LIST_SORT_BY_VALUES,
  LEAD_SORT_ORDER_VALUES,
} from '../constants/lead-list-sort.js';

export const LEAD_SEARCH_BY_VALUES = [
  'all',
  'name',
  'email',
  'phone',
] as const;

export type LeadSearchBy = (typeof LEAD_SEARCH_BY_VALUES)[number];

function firstQueryValue(
  value: string | string[] | undefined,
): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === undefined ? undefined : raw;
}

function normalizeSearch(
  value: string | string[] | undefined,
): string | undefined {
  const raw = firstQueryValue(value);

  if (raw === undefined) {
    return undefined;
  }

  const trimmed = raw.trim();
  return trimmed === '' ? undefined : trimmed;
}

const queryString = z.union([z.string(), z.array(z.string())]).optional();

export const listLeadsQuerySchema = z.object({
  search: queryString.transform(normalizeSearch),
  searchBy: queryString
    .transform((value) => {
      const raw = firstQueryValue(value);
      if (raw === undefined) {
        return undefined;
      }
      return raw.trim();
    })
    .pipe(
      z
        .enum(LEAD_SEARCH_BY_VALUES, {
          error: 'searchBy must be one of: all, name, email, phone',
        })
        .optional(),
    ),
  sortBy: queryString
    .transform((value) => {
      const raw = firstQueryValue(value);
      if (raw === undefined) {
        return undefined;
      }
      return raw.trim();
    })
    .pipe(
      z
        .enum(LEAD_LIST_SORT_BY_VALUES, {
          error: 'sortBy must be one of: name, email, status',
        })
        .optional(),
    ),
  sortOrder: queryString
    .transform((value) => {
      const raw = firstQueryValue(value);
      if (raw === undefined) {
        return undefined;
      }
      return raw.trim();
    })
    .pipe(
      z
        .enum(LEAD_SORT_ORDER_VALUES, {
          error: 'sortOrder must be one of: asc, desc',
        })
        .optional(),
    ),
});

export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
