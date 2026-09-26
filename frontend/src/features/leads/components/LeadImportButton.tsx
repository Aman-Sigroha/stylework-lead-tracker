import { useRef, useState, type ChangeEvent } from 'react';
import { previewLeadImport } from '../api/leads-import-api.js';
import { ApiRequestError } from '../../../lib/api-errors.js';
import type { LeadImportPreview } from '../../../types/lead-import.js';
import { useConfirmLeadImportMutation } from '../hooks/useConfirmLeadImportMutation.ts';
import { ImportLeadCsvDialog } from './ImportLeadCsvDialog.tsx';
import { InlineErrorBanner } from './InlineErrorBanner.tsx';

type LeadImportButtonProps = {
  onImported: (importedCount: number) => void;
};

export function LeadImportButton({ onImported }: LeadImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<LeadImportPreview | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const confirmMutation = useConfirmLeadImportMutation();

  const resetFileInput = () => {
    if (fileInputRef.current !== null) {
      fileInputRef.current.value = '';
    }
  };

  const closePreview = () => {
    setPreview(null);
    setConfirmError(null);
    resetFileInput();
  };

  const handleChooseFile = () => {
    setPreviewError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file === undefined) {
      return;
    }

    setIsPreviewing(true);
    setPreviewError(null);

    try {
      const result = await previewLeadImport(file);
      setPreview(result);
      setConfirmError(null);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setPreviewError(error.message);
      } else if (error instanceof Error) {
        setPreviewError(error.message);
      } else {
        setPreviewError('Failed to preview CSV import');
      }
      resetFileInput();
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleConfirm = async () => {
    if (preview === null || preview.validLeads.length === 0) {
      return;
    }

    setConfirmError(null);

    try {
      const result = await confirmMutation.mutateAsync(preview.validLeads);
      closePreview();
      onImported(result.importedCount);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setConfirmError(error.message);
      } else if (error instanceof Error) {
        setConfirmError(error.message);
      } else {
        setConfirmError('Failed to import leads');
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="lead-import__file-input"
        aria-label="Import CSV file"
        onChange={(event) => void handleFileChange(event)}
      />
      <button
        type="button"
        className="lead-export__button"
        onClick={handleChooseFile}
        disabled={isPreviewing || confirmMutation.isPending}
        aria-busy={isPreviewing}
      >
        {isPreviewing ? 'Loading preview...' : 'Import CSV'}
      </button>
      {previewError !== null ? (
        <InlineErrorBanner message={previewError} />
      ) : null}
      {preview !== null ? (
        <ImportLeadCsvDialog
          preview={preview}
          isConfirming={confirmMutation.isPending}
          confirmError={confirmError}
          onCancel={closePreview}
          onConfirm={() => void handleConfirm()}
        />
      ) : null}
    </>
  );
}
