import { useEffect, useId, useRef } from 'react';
import { useCreateLeadMutation } from '../hooks/useCreateLeadMutation.ts';
import { formValuesToLeadPayload } from '../lib/lead-form-values.ts';
import { leadFormDefaultValues } from '../schemas/create-lead-form.schema.ts';
import { LeadForm } from './LeadForm.tsx';

type CreateLeadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function CreateLeadModal({
  isOpen,
  onClose,
  onCreated,
}: CreateLeadModalProps) {
  const createLeadMutation = useCreateLeadMutation();
  const isSubmitting = createLeadMutation.isPending;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formId = useId();
  const titleId = useId();

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
      aria-labelledby={titleId}
      onCancel={(event) => {
        if (isSubmitting) {
          event.preventDefault();
          return;
        }

        onClose();
      }}
      onClose={handleRequestClose}
    >
      <div className="lead-modal__panel">
        <header className="lead-modal__header">
          <h2 id={titleId} className="lead-modal__title">Create lead</h2>
          <button
            type="button"
            className="lead-modal__close"
            onClick={handleRequestClose}
            disabled={isSubmitting}
            aria-label="Close create lead dialog"
          >
            ×
          </button>
        </header>

        <LeadForm
          formId={formId}
          isOpen={isOpen}
          mode="create"
          initialValues={leadFormDefaultValues}
          isSubmitting={isSubmitting}
          onCancel={handleRequestClose}
          onSuccess={onCreated}
          onSubmitValues={async (values) => {
            await createLeadMutation.mutateAsync(formValuesToLeadPayload(values));
          }}
        />
      </div>
    </dialog>
  );
}
