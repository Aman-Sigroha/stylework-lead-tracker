import { useEffect, useId, useMemo, useRef } from 'react';
import type { Lead } from '../../../types/lead.js';
import { useUpdateLeadMutation } from '../hooks/useUpdateLeadMutation.ts';
import {
  formValuesToLeadPayload,
  leadToFormValues,
} from '../lib/lead-form-values.ts';
import { LeadForm } from './LeadForm.tsx';

type EditLeadModalProps = {
  lead: Lead | null;
  onClose: () => void;
  onUpdated: () => void;
};

export function EditLeadModal({ lead, onClose, onUpdated }: EditLeadModalProps) {
  const updateLeadMutation = useUpdateLeadMutation();
  const isSubmitting = updateLeadMutation.isPending;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formId = useId();
  const titleId = useId();
  const isOpen = lead !== null;
  const initialValues = useMemo(
    () => (lead !== null ? leadToFormValues(lead) : undefined),
    [lead],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleRequestClose = () => {
    if (isSubmitting) {
      return;
    }

    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="lead-modal"
      aria-labelledby={lead !== null ? titleId : undefined}
      onCancel={(event) => {
        if (isSubmitting) {
          event.preventDefault();
          return;
        }

        onClose();
      }}
      onClose={handleRequestClose}
    >
      {lead !== null ? (
        <div className="lead-modal__panel">
          <header className="lead-modal__header">
            <h2 id={titleId} className="lead-modal__title">Edit Lead</h2>
            <button
              type="button"
              className="lead-modal__close"
              onClick={handleRequestClose}
              disabled={isSubmitting}
              aria-label="Close edit lead dialog"
            >
              ×
            </button>
          </header>

          <LeadForm
            formId={formId}
            isOpen={isOpen}
            mode="edit"
            initialValues={initialValues}
            isSubmitting={isSubmitting}
            onCancel={handleRequestClose}
            onSuccess={onUpdated}
            onSubmitValues={async (values) => {
              await updateLeadMutation.mutateAsync({
                id: lead.id,
                ...formValuesToLeadPayload(values),
              });
            }}
          />
        </div>
      ) : null}
    </dialog>
  );
}
