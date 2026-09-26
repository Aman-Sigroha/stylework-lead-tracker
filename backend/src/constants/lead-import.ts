export const LEAD_IMPORT_CSV_FIELD = 'file';

/** Maximum CSV upload size (1 MiB). */
export const LEAD_IMPORT_MAX_FILE_SIZE_BYTES = 1024 * 1024;

/** Maximum data rows processed per import request. */
export const LEAD_IMPORT_MAX_ROWS = 1000;

export const LEAD_IMPORT_REQUIRED_COLUMNS = [
  'name',
  'email',
  'phone',
  'status',
] as const;

/**
 * The leads table indexes email but does not enforce uniqueness; import allows
 * duplicate emails consistent with manual lead creation.
 */
