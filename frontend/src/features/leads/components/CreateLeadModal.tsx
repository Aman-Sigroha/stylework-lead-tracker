import { useEffect, useId, useRef } from 'react';
import { useCreateLeadMutation } from '../hooks/useCreateLeadMutation.ts';
import { CreateLeadForm } from './CreateLeadForm.tsx';

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

        <CreateLeadForm
          formId={formId}
          isOpen={isOpen}
          mutation={createLeadMutation}
          onCancel={handleRequestClose}
          onSuccess={onCreated}
        />
      </div>
    </dialog>
  );
}
