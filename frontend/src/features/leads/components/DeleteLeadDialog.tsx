import { useEffect, useId, useRef, useState } from 'react';
import type { Lead } from '../../../types/lead.js';
import { useDeleteLeadMutation } from '../hooks/useDeleteLeadMutation.ts';
import { getDeleteLeadErrorMessage } from '../lib/delete-lead-errors.ts';

type DeleteLeadDialogProps = {
  lead: Lead | null;
  onClose: () => void;
  onDeleted: () => void;
};

export function DeleteLeadDialog({
  lead,
  onClose,
  onDeleted,
}: DeleteLeadDialogProps) {
  const deleteLeadMutation = useDeleteLeadMutation();
  const isPending = deleteLeadMutation.isPending;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isOpen = lead !== null;

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

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
    }
  }, [isOpen, lead?.id]);

  const handleRequestClose = () => {
    if (isPending) {
      return;
    }

    onClose();
  };

  const handleConfirmDelete = () => {
    if (lead === null || isPending) {
      return;
    }

    setErrorMessage(null);

    deleteLeadMutation.mutate(lead.id, {
      onSuccess: () => {
        onDeleted();
      },
      onError: (error) => {
        setErrorMessage(getDeleteLeadErrorMessage(error));
      },
    });
  };

  return (
    <dialog
      ref={dialogRef}
      className="lead-modal lead-modal--confirm"
      aria-labelledby={lead !== null ? titleId : undefined}
      aria-describedby={lead !== null ? messageId : undefined}
      onCancel={(event) => {
        if (isPending) {
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
            <h2 id={titleId} className="lead-modal__title">Delete lead</h2>
            <button
              type="button"
              className="lead-modal__close"
              onClick={handleRequestClose}
              disabled={isPending}
              aria-label="Close delete lead dialog"
            >
              ×
            </button>
          </header>

          <div id={messageId} className="delete-lead-dialog__body">
            <p className="delete-lead-dialog__prompt">
              Are you sure you want to delete this lead?
            </p>
            <p className="delete-lead-dialog__lead">
              <strong>{lead.name}</strong>
              <span className="delete-lead-dialog__email">{lead.email}</span>
            </p>

            {errorMessage !== null ? (
              <p className="delete-lead-dialog__error" role="alert">
                {errorMessage}
              </p>
            ) : null}
          </div>

          <div className="delete-lead-dialog__actions">
            <button
              type="button"
              className="create-lead-form__button create-lead-form__button--secondary"
              onClick={handleRequestClose}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="create-lead-form__button create-lead-form__button--danger"
              onClick={handleConfirmDelete}
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
