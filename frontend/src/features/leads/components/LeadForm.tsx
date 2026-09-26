import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ApiRequestError, getApiValidationDetails } from '../../../lib/api-errors.js';
import { LEAD_STATUSES } from '../../../types/lead.js';
import {
  leadFormDefaultValues,
  leadFormSchema,
  type LeadFormValues,
} from '../schemas/create-lead-form.schema.js';

type LeadFormProps = {
  formId: string;
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialValues?: LeadFormValues;
  isSubmitting: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  onSubmitValues: (values: LeadFormValues) => Promise<void>;
};

function formatStatusLabel(status: LeadFormValues['status']): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function LeadForm({
  formId,
  isOpen,
  mode,
  initialValues = leadFormDefaultValues,
  isSubmitting,
  onCancel,
  onSuccess,
  onSubmitValues,
}: LeadFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: leadFormDefaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      reset(initialValues);
      clearErrors();
    }
  }, [isOpen, initialValues, reset, clearErrors]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await onSubmitValues(values);
      reset(leadFormDefaultValues);
      onSuccess();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const details = getApiValidationDetails(error.body);

        if (error.status === 400 && details !== undefined && details.length > 0) {
          for (const detail of details) {
            if (
              detail.field === 'name' ||
              detail.field === 'email' ||
              detail.field === 'phone' ||
              detail.field === 'status'
            ) {
              setError(detail.field, { message: detail.message });
            } else {
              setError('root', { message: detail.message });
            }
          }
          return;
        }

        setError('root', {
          message:
            error.status === 400
              ? error.message
              : mode === 'create'
                ? 'Unable to create lead. Please try again.'
                : 'Unable to update lead. Please try again.',
        });
        return;
      }

      setError('root', {
        message:
          mode === 'create'
            ? 'Unable to create lead. Please check your connection and try again.'
            : 'Unable to update lead. Please check your connection and try again.',
      });
    }
  });

  const submitLabel = mode === 'create' ? 'Create lead' : 'Save Changes';
  const submittingLabel = mode === 'create' ? 'Creating...' : 'Saving...';
  const nameFieldId = `${formId}-name`;
  const emailFieldId = `${formId}-email`;
  const phoneFieldId = `${formId}-phone`;
  const statusFieldId = `${formId}-status`;

  return (
    <form id={formId} className="create-lead-form" onSubmit={onSubmit} noValidate>
      {errors.root ? (
        <p className="create-lead-form__banner create-lead-form__banner--error" role="alert">
          {errors.root.message}
        </p>
      ) : null}

      <div className="create-lead-form__field">
        <label className="create-lead-form__label" htmlFor={nameFieldId}>
          Name
        </label>
        <input
          id={nameFieldId}
          className="create-lead-form__input"
          type="text"
          autoComplete="name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? `${nameFieldId}-error` : undefined}
          disabled={isSubmitting}
          {...register('name')}
        />
        {errors.name ? (
          <p id={`${nameFieldId}-error`} className="create-lead-form__error">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="create-lead-form__field">
        <label className="create-lead-form__label" htmlFor={emailFieldId}>
          Email
        </label>
        <input
          id={emailFieldId}
          className="create-lead-form__input"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? `${emailFieldId}-error` : undefined}
          disabled={isSubmitting}
          {...register('email')}
        />
        {errors.email ? (
          <p id={`${emailFieldId}-error`} className="create-lead-form__error">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="create-lead-form__field">
        <label className="create-lead-form__label" htmlFor={phoneFieldId}>
          Phone <span className="create-lead-form__optional">(optional)</span>
        </label>
        <input
          id={phoneFieldId}
          className="create-lead-form__input"
          type="tel"
          autoComplete="tel"
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? `${phoneFieldId}-error` : undefined}
          disabled={isSubmitting}
          {...register('phone')}
        />
        {errors.phone ? (
          <p id={`${phoneFieldId}-error`} className="create-lead-form__error">
            {errors.phone.message}
          </p>
        ) : null}
      </div>

      <div className="create-lead-form__field">
        <label className="create-lead-form__label" htmlFor={statusFieldId}>
          Status
        </label>
        <select
          id={statusFieldId}
          className="create-lead-form__select"
          aria-invalid={errors.status ? true : undefined}
          aria-describedby={errors.status ? `${statusFieldId}-error` : undefined}
          disabled={isSubmitting}
          {...register('status')}
        >
          {LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {formatStatusLabel(status)}
            </option>
          ))}
        </select>
        {errors.status ? (
          <p id={`${statusFieldId}-error`} className="create-lead-form__error">
            {errors.status.message}
          </p>
        ) : null}
      </div>

      <div className="create-lead-form__actions">
        <button
          type="button"
          className="create-lead-form__button create-lead-form__button--secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="create-lead-form__button create-lead-form__button--primary"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
