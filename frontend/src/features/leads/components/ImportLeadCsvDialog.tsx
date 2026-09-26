import type { LeadImportPreview } from '../../../types/lead-import.js';
import { InlineErrorBanner } from './InlineErrorBanner.tsx';

type ImportLeadCsvDialogProps = {
  preview: LeadImportPreview;
  isConfirming: boolean;
  confirmError: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ImportLeadCsvDialog({
  preview,
  isConfirming,
  confirmError,
  onCancel,
  onConfirm,
}: ImportLeadCsvDialogProps) {
  const canConfirm = preview.validRows > 0 && !isConfirming;
  const validationErrors = preview.errors.filter(
    (error) => error.type === 'validation',
  );
  const duplicateErrors = preview.errors.filter(
    (error) => error.type === 'duplicate',
  );

  return (
    <dialog className="lead-modal" open aria-label="Import CSV preview">
      <div
        className="lead-modal__panel import-lead-dialog"
        role="document"
      >
        <h2 className="lead-modal__title">Import CSV preview</h2>

        <dl className="import-lead-dialog__summary import-lead-dialog__summary--four">
          <div>
            <dt>Total rows</dt>
            <dd>{preview.totalRows}</dd>
          </div>
          <div>
            <dt>Ready to import</dt>
            <dd>{preview.validRows}</dd>
          </div>
          <div>
            <dt>Duplicates</dt>
            <dd>{preview.duplicateRows}</dd>
          </div>
          <div>
            <dt>Invalid</dt>
            <dd>{preview.invalidRows}</dd>
          </div>
        </dl>

        {preview.validRows === 0 ? (
          <p className="import-lead-dialog__empty" role="status">
            No rows are ready to import. Fix validation errors and duplicates,
            then upload the file again.
          </p>
        ) : null}

        {confirmError !== null ? (
          <InlineErrorBanner message={confirmError} />
        ) : null}

        {duplicateErrors.length > 0 ? (
          <div className="import-lead-dialog__errors import-lead-dialog__errors--duplicates">
            <h3 className="import-lead-dialog__errors-title">Duplicates</h3>
            <ul className="import-lead-dialog__errors-list">
              {duplicateErrors.map((error) => (
                <li key={`dup-${error.row}-${error.email ?? error.message}`}>
                  Row {error.row}
                  {error.email !== undefined ? `: ${error.email}` : ''} —{' '}
                  {error.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {validationErrors.length > 0 ? (
          <div className="import-lead-dialog__errors">
            <h3 className="import-lead-dialog__errors-title">
              Validation errors
            </h3>
            <ul className="import-lead-dialog__errors-list">
              {validationErrors.map((error) => (
                <li key={`${error.row}-${error.field}-${error.message}`}>
                  Row {error.row}, {error.field}: {error.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="import-lead-dialog__actions">
          <button
            type="button"
            className="create-lead-form__button create-lead-form__button--secondary"
            onClick={onCancel}
            disabled={isConfirming}
          >
            Cancel
          </button>
          <button
            type="button"
            className="create-lead-form__button create-lead-form__button--primary"
            onClick={onConfirm}
            disabled={!canConfirm}
            aria-busy={isConfirming}
          >
            {isConfirming ? 'Importing...' : 'Import Valid Rows'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
