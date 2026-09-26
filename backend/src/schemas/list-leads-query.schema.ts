import { z } from 'zod';
import { LEAD_STATUSES } from '../constants/lead-status.js';
import {
  LIST_LEADS_DEFAULT_LIMIT,
  LIST_LEADS_DEFAULT_PAGE,
  LIST_LEADS_MAX_LIMIT,
} from '../constants/list-leads-pagination.js';
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

function normalizeOptionalQueryString(
  value: string | string[] | undefined,
): string | undefined {
  const raw = firstQueryValue(value);

  if (raw === undefined) {
    return undefined;
  }

  const trimmed = raw.trim();
  return trimmed === '' ? undefined : trimmed;
}

function parsePositiveInteger(
  value: string | undefined,
  fieldLabel: string,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(`${fieldLabel} must be a positive integer`);
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${fieldLabel} must be a positive integer`);
  }

  return parsed;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseIsoDateString(
  value: string | undefined,
  fieldLabel: string,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!ISO_DATE_PATTERN.test(value)) {
    throw new Error(`${fieldLabel} must be a valid ISO date (YYYY-MM-DD)`);
  }

  const parsed = Date.parse(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsed)) {
    throw new Error(`${fieldLabel} must be a valid ISO date (YYYY-MM-DD)`);
  }

  return value;
}

const queryString = z.union([z.string(), z.array(z.string())]).optional();

const pageSchema = queryString
  .transform(normalizeOptionalQueryString)
  .transform((value, ctx) => {
    try {
      const parsed = parsePositiveInteger(value, 'page');
      return parsed ?? LIST_LEADS_DEFAULT_PAGE;
    } catch (error) {
      ctx.addIssue({
        code: 'custom',
        message:
          error instanceof Error ? error.message : 'page must be a positive integer',
      });
      return z.NEVER;
    }
  });

const limitSchema = queryString
  .transform(normalizeOptionalQueryString)
  .transform((value, ctx) => {
    try {
      const parsed = parsePositiveInteger(value, 'limit');
      const limit = parsed ?? LIST_LEADS_DEFAULT_LIMIT;

      if (limit > LIST_LEADS_MAX_LIMIT) {
        ctx.addIssue({
          code: 'custom',
          message: `limit must not exceed ${LIST_LEADS_MAX_LIMIT}`,
        });
        return z.NEVER;
      }

      return limit;
    } catch (error) {
      ctx.addIssue({
        code: 'custom',
        message:
          error instanceof Error
            ? error.message
            : 'limit must be a positive integer',
      });
      return z.NEVER;
    }
  });

export const listLeadsQuerySchema = z
  .object({
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
    page: pageSchema,
    limit: limitSchema,
    status: queryString
      .transform(normalizeOptionalQueryString)
      .pipe(
        z
          .enum(LEAD_STATUSES, {
            error: 'status must be one of: new, contacted, qualified, converted, lost',
          })
          .optional(),
      ),
    createdFrom: queryString
      .transform(normalizeOptionalQueryString)
      .transform((value, ctx) => {
        try {
          return parseIsoDateString(value, 'createdFrom');
        } catch (error) {
          ctx.addIssue({
            code: 'custom',
            message:
              error instanceof Error
                ? error.message
                : 'createdFrom must be a valid ISO date (YYYY-MM-DD)',
          });
          return z.NEVER;
        }
      }),
    createdTo: queryString
      .transform(normalizeOptionalQueryString)
      .transform((value, ctx) => {
        try {
          return parseIsoDateString(value, 'createdTo');
        } catch (error) {
          ctx.addIssue({
            code: 'custom',
            message:
              error instanceof Error
                ? error.message
                : 'createdTo must be a valid ISO date (YYYY-MM-DD)',
          });
          return z.NEVER;
        }
      }),
  })
  .superRefine((data, ctx) => {
    if (
      data.createdFrom !== undefined &&
      data.createdTo !== undefined &&
      data.createdFrom > data.createdTo
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'createdFrom must not be after createdTo',
        path: ['createdFrom'],
      });
    }
  });

export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
