import { z } from 'zod';

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
});

export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
