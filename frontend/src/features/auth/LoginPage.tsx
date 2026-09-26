import { useState, type FormEvent } from 'react';
import { useLoginMutation } from './hooks/useLoginMutation.ts';
import { ApiRequestError } from '../../lib/api-errors.js';
import './LoginPage.css';

export function LoginPage() {
  const loginMutation = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();

    if (trimmedEmail === '') {
      nextErrors.email = 'Email is required';
    }

    if (password === '') {
      nextErrors.password = 'Password is required';
    }

    setFieldErrors(nextErrors);
    setFormError(null);

    if (nextErrors.email !== undefined || nextErrors.password !== undefined) {
      return;
    }

    loginMutation.mutate(
      { email: trimmedEmail, password },
      {
        onError: (error) => {
          if (error instanceof ApiRequestError && error.status === 401) {
            setFormError('Invalid email or password');
            return;
          }

          setFormError(
            error instanceof Error ? error.message : 'Failed to log in',
          );
        },
      },
    );
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <p className="login-card__eyebrow">Stylework</p>
        <h1 className="login-card__title">Lead Tracker</h1>
        <p className="login-card__subtitle">Sign in to manage leads.</p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label className="login-form__field">
            <span className="login-form__label">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={fieldErrors.email !== undefined}
            />
            {fieldErrors.email !== undefined ? (
              <span className="login-form__error" role="alert">
                {fieldErrors.email}
              </span>
            ) : null}
          </label>

          <label className="login-form__field">
            <span className="login-form__label">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={fieldErrors.password !== undefined}
            />
            {fieldErrors.password !== undefined ? (
              <span className="login-form__error" role="alert">
                {fieldErrors.password}
              </span>
            ) : null}
          </label>

          {formError !== null ? (
            <p className="login-form__banner" role="alert">{formError}</p>
          ) : null}

          <button
            type="submit"
            className="login-form__submit"
            disabled={loginMutation.isPending}
            aria-busy={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
