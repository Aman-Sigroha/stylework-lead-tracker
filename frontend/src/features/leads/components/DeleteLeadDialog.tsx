import { useEffect, useId, useRef, useState } from 'react';
import type { Lead } from '../../../types/lead.js';
import { useDeleteLeadMutation } from '../hooks/useDeleteLeadMutation.ts';
import { getDeleteLeadErrorMessage } from '../lib/delete-lead-errors.ts';

type DeleteLeadDialogProps = {
  lead: Lead | null;
  onClose: () => void;
  onDeleted: () => void;
};

type DeleteLeadError = {
  leadId: string;
  message: string;
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
  const [deleteError, setDeleteError] = useState<DeleteLeadError | null>(null);
  const isOpen = lead !== null;
  const errorMessage =
    lead !== null && deleteError?.leadId === lead.id
      ? deleteError.message
      : null;

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
    if (isPending) {
      return;
    }

    setDeleteError(null);
    onClose();
  };

  const handleConfirmDelete = () => {
    if (lead === null || isPending) {
      return;
    }

    setDeleteError(null);

    deleteLeadMutation.mutate(lead.id, {
      onSuccess: () => {
        onDeleted();
      },
      onError: (error) => {
        setDeleteError({
          leadId: lead.id,
          message: getDeleteLeadErrorMessage(error),
        });
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

        setDeleteError(null);
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
