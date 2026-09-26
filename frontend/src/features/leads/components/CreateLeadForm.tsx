import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ApiRequestError, getApiValidationDetails } from '../../../lib/api-errors.js';
import { LEAD_STATUSES } from '../../../types/lead.js';
import {
  createLeadFormDefaultValues,
  createLeadFormSchema,
  type CreateLeadFormValues,
} from '../schemas/create-lead-form.schema.js';
import type { useCreateLeadMutation } from '../hooks/useCreateLeadMutation.js';

type CreateLeadFormProps = {
  formId: string;
  isOpen: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  mutation: ReturnType<typeof useCreateLeadMutation>;
};

function formatStatusLabel(status: CreateLeadFormValues['status']): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function CreateLeadForm({
  formId,
  isOpen,
  onCancel,
  onSuccess,
  mutation: createLeadMutation,
}: CreateLeadFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CreateLeadFormValues>({
    resolver: zodResolver(createLeadFormSchema),
    defaultValues: createLeadFormDefaultValues,
  });

  const isSubmitting = createLeadMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      reset(createLeadFormDefaultValues);
      clearErrors();
    }
  }, [isOpen, reset, clearErrors]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createLeadMutation.mutateAsync({
        name: values.name,
        email: values.email,
        status: values.status,
        ...(values.phone.trim() !== '' ? { phone: values.phone.trim() } : {}),
      });

      reset(createLeadFormDefaultValues);
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
              : 'Unable to create lead. Please try again.',
        });
        return;
      }

      setError('root', {
        message: 'Unable to create lead. Please check your connection and try again.',
      });
    }
  });

  return (
    <form id={formId} className="create-lead-form" onSubmit={onSubmit} noValidate>
      {errors.root ? (
        <p className="create-lead-form__banner create-lead-form__banner--error" role="alert">
          {errors.root.message}
        </p>
      ) : null}

      <div className="create-lead-form__field">
        <label className="create-lead-form__label" htmlFor="create-lead-name">
          Name
        </label>
        <input
          id="create-lead-name"
          className="create-lead-form__input"
          type="text"
          autoComplete="name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'create-lead-name-error' : undefined}
          disabled={isSubmitting}
          {...register('name')}
        />
        {errors.name ? (
          <p id="create-lead-name-error" className="create-lead-form__error">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="create-lead-form__field">
        <label className="create-lead-form__label" htmlFor="create-lead-email">
          Email
        </label>
        <input
          id="create-lead-email"
          className="create-lead-form__input"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'create-lead-email-error' : undefined}
          disabled={isSubmitting}
          {...register('email')}
        />
        {errors.email ? (
          <p id="create-lead-email-error" className="create-lead-form__error">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="create-lead-form__field">
        <label className="create-lead-form__label" htmlFor="create-lead-phone">
          Phone <span className="create-lead-form__optional">(optional)</span>
        </label>
        <input
          id="create-lead-phone"
          className="create-lead-form__input"
          type="tel"
          autoComplete="tel"
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? 'create-lead-phone-error' : undefined}
          disabled={isSubmitting}
          {...register('phone')}
        />
        {errors.phone ? (
          <p id="create-lead-phone-error" className="create-lead-form__error">
            {errors.phone.message}
          </p>
        ) : null}
      </div>

      <div className="create-lead-form__field">
        <label className="create-lead-form__label" htmlFor="create-lead-status">
          Status
        </label>
        <select
          id="create-lead-status"
          className="create-lead-form__select"
          aria-invalid={errors.status ? true : undefined}
          aria-describedby={errors.status ? 'create-lead-status-error' : undefined}
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
          <p id="create-lead-status-error" className="create-lead-form__error">
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
          {isSubmitting ? 'Creating...' : 'Create lead'}
        </button>
      </div>
    </form>
  );
}
