'use client';

/**
 * Change Password Page — Client Component
 *
 * Prinsip yang diterapkan (Software Design & Architecture Roadmap):
 *
 * Clean Code:
 *   - Meaningful names over comments
 *   - Keep classes/files small → UI dipecah ke sub-komponen
 *   - Pure functions untuk helper/validator
 *   - Command-query separation: submit handler hanya memberi perintah,
 *     state query dikelola hook
 *
 * Design Principles:
 *   - SRP (Single Responsibility): tiap komponen/hook punya satu alasan berubah
 *   - DRY: UserProfile type dari shared `app/types`, PROFILE_FIELDS cukup di satu tempat
 *   - YAGNI: tidak ada fitur yang belum dibutuhkan
 *   - Program to abstractions: komponen menerima data via props, bukan fetch sendiri
 *
 * Functional Programming:
 *   - Enkapsulasi state & side-effect ke custom hook `useChangePassword`
 *   - Validator sebagai pure function terpisah
 */

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { toTitleCase } from '@/utils/textManipulation';
import { getProxiedImageUrl } from '@/utils/imageHelper';
import type { UserProfile } from '@/app/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChangePasswordPageProps {
  /** Profile di-fetch di server (SSR) dan diteruskan sebagai prop. */
  profile: UserProfile | null;
}

interface ChangePasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROFILE_FIELDS: { label: string; key: keyof UserProfile }[] = [
  { label: 'Username', key: 'username' },
  { label: 'Fullname', key: 'fullname' },
  { label: 'Email', key: 'email' },
  { label: 'Phone', key: 'phone' },
  { label: 'ID Karyawan', key: 'idkaryawan' },
  { label: 'Level', key: 'level' },
  { label: 'Position', key: 'position' },
  { label: 'FCBA', key: 'fcba' },
  { label: 'Afdeling', key: 'afdeling' },
  { label: 'Gang Code', key: 'gangcode' },
];

const FALLBACK_AVATAR =
  'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp';

// ─── Pure Validators (Clean Code: pure functions) ─────────────────────────────

function validatePasswordMatch(
  newPassword: string,
  confirmPassword: string,
  message: string
): string | null {
  if (newPassword !== confirmPassword) return message;
  return null;
}

function validatePasswordLength(password: string, message: string, minLength = 8): string | null {
  if (password.length < minLength) return message;
  return null;
}

// ─── Custom Hook (SRP: enkapsulasi form logic) ────────────────────────────────

function useChangePassword() {
  const t = useTranslations('Profile');
  const [form, setForm] = useState<ChangePasswordFormState>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /** Query: apakah konfirmasi password cocok (untuk live validation). */
  const isConfirmMismatch =
    !!form.newPassword && !!form.confirmPassword && form.newPassword !== form.confirmPassword;

  /** Command: update salah satu field form. */
  function updateField(field: keyof ChangePasswordFormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  /** Command: reset seluruh form ke initial state. */
  function resetForm() {
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  }

  /** Command: submit form — satu-satunya fungsi yang menyentuh API. */
  async function submitChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const matchError = validatePasswordMatch(
      form.newPassword,
      form.confirmPassword,
      t('mismatchError')
    );
    if (matchError) {
      setError(matchError);
      return;
    }

    const lengthError = validatePasswordLength(form.newPassword, t('lengthError', { min: 8 }));
    if (lengthError) {
      setError(lengthError);
      return;
    }

    setLoading(true);
    try {
      // Get CSRF token from cookie
      const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1];

      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({
          current_password: form.currentPassword,
          new_password: form.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || t('success'));
        resetForm();
      } else {
        setError(data.message || t('unexpectedError'));
      }
    } catch {
      setError(t('unexpectedError'));
    } finally {
      setLoading(false);
    }
  }

  return {
    form,
    loading,
    error,
    success,
    isConfirmMismatch,
    updateField,
    submitChangePassword,
  };
}

// ─── Sub-Components (SRP: satu komponen, satu tanggung jawab) ─────────────────

/** Menampilkan satu field input password. */
function PasswordField({
  label,
  placeholder,
  value,
  hasError = false,
  errorText,
  ariaDescribedBy,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  hasError?: boolean;
  errorText?: string;
  ariaDescribedBy?: string;
  onChange: (value: string) => void;
}) {
  const tAuth = useTranslations('Auth');
  const [show, setShow] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);
  const inputId = `password-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const errorId = `${inputId}-error`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    setIsCapsLock(e.getModifierState('CapsLock'));
  };

  const describedBy = [ariaDescribedBy, hasError && errorText ? errorId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="form-control gap-1">
      <label htmlFor={inputId} className="label py-1">
        <span className="label-text font-medium">{label}</span>
      </label>
      <label
        className={`input input-bordered flex max-w-none items-center gap-2 transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/70 ${hasError ? 'border-error' : ''}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-4 w-4 opacity-70"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
            clipRule="evenodd"
          />
        </svg>
        <input
          id={inputId}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          className="grow bg-transparent outline-none"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyDown}
          required
          minLength={8}
          aria-describedby={describedBy || undefined}
          aria-invalid={hasError ? 'true' : 'false'}
        />
        <button
          type="button"
          onClick={() => setShow(prev => !prev)}
          className="btn btn-ghost btn-square btn-xs opacity-70 hover:text-primary"
          aria-label={show ? tAuth('hidePassword') : tAuth('showPassword')}
          title={show ? tAuth('hidePassword') : tAuth('showPassword')}
        >
          {show ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M13.359 11.238C15.28 9.504 16 8 16 8s-3-5.5-8-5.5a7.027 7.027 0 0 0-3.646.98L3.468 3.538A8.08 8.08 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.827 8c-.058.087-.122.176-.195.268a13.134 13.134 0 0 1-1.66 2.043C11.88 11.332 10.12 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.173 8Z" />
              <path d="M10.477 11.085 8.4 9.008a2 2 0 1 1-2.83-2.83L4.914 4.78A4.978 4.978 0 0 0 3.5 8c0 2.12 1.168 3.879 2.457 5.168a13.133 13.133 0 0 0 2.043 1.66c.12.08.236.148.345.208l1.677-1.677a7.027 7.027 0 0 1-1.545-.274ZM8 6.5a1.5 1.5 0 0 0-1.356 2.121L8.879 9.15A1.5 1.5 0 0 0 8 6.5Z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8ZM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.827 8c-.058.087-.122.176-.195.268a13.134 13.134 0 0 1-1.66 2.043C11.88 11.332 10.12 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.173 8Z" />
              <path d="M8 5.5A2.5 2.5 0 1 0 8 10.5a2.5 2.5 0 0 0 0-5Z" />
            </svg>
          )}
        </button>
      </label>
      {hasError && errorText && (
        <span
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-error flex items-center gap-2 px-1 text-[0.6875rem] animate-fadeIn"
        >
          <span className="status status-error inline-block" aria-hidden="true" />
          {errorText}
        </span>
      )}
      {isCapsLock && (
        <span
          className="text-warning flex items-center gap-2 px-1 text-[0.6875rem] animate-fadeIn"
          role="alert"
          aria-live="polite"
        >
          <span className="status status-warning inline-block" aria-hidden="true" />
          {tAuth('capsLock')}
        </span>
      )}
    </div>
  );
}

/** Menampilkan pesan alert (error atau success). */
function FormAlert({ type, message }: { type: 'error' | 'success'; message: string }) {
  const isError = type === 'error';
  return (
    <div
      className={`alert ${isError ? 'alert-error' : 'alert-success'} shadow-sm text-sm animate-fadeIn`}
      role="alert"
      aria-live="polite"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="stroke-current shrink-0 h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        {isError ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        )}
      </svg>
      <span>{message}</span>
    </div>
  );
}

/** Menampilkan kartu profil pengguna di sisi kiri. */
function UserProfileCard({ profile }: { profile: UserProfile | null }) {
  const t = useTranslations('Profile');

  if (!profile) {
    return (
      <div className="card bg-base-100 shadow-xl border border-base-300 h-full">
        <div className="card-body items-center justify-center">
          <p className="text-base-content/60">{t('failedLoadProfile')}</p>
        </div>
      </div>
    );
  }

  const avatarSrc = getProxiedImageUrl(profile.photo ?? '') || FALLBACK_AVATAR;
  const displayName = profile.fullname ? toTitleCase(profile.fullname) : 'User';
  const displayRole = profile.position || profile.level || 'Staff';

  return (
    <div className="card bg-base-100 shadow-xl border border-base-300 h-full">
      <div className="card-body items-center text-center">
        <div className="avatar mb-2">
          <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 shadow-lg">
            <Image
              src={avatarSrc}
              alt={`Avatar ${displayName}`}
              width={96}
              height={96}
              className="object-cover"
              unoptimized
            />
          </div>
        </div>

        <h2 className="card-title text-xl font-bold">{displayName}</h2>
        <div className="badge badge-secondary badge-outline mt-1 mb-4">{displayRole}</div>

        <dl className="w-full flex flex-col gap-3 text-left mt-2 text-sm">
          {PROFILE_FIELDS.map(({ label, key }) => (
            <div key={key} className="flex justify-between border-b border-base-200 pb-2">
              <dt className="text-base-content/60">{label}</dt>
              <dd className="font-medium">{String(profile[key] ?? '-')}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/** Form ganti password. */
function ChangePasswordForm() {
  const t = useTranslations('Profile');
  const {
    form,
    loading,
    error,
    success,
    isConfirmMismatch,
    updateField,
    submitChangePassword,
  } = useChangePassword();

  return (
    <div className="card bg-base-100 shadow-xl border border-base-300">
      <div className="card-body">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h2 className="card-title text-xl">{t('changePassword')}</h2>
            <p className="text-xs text-base-content/60">{t('changePasswordSubtitle')}</p>
          </div>
        </div>

        <form onSubmit={submitChangePassword} className="flex flex-col gap-5" noValidate>
          <PasswordField
            label={t('currentPassword')}
            placeholder={t('currentPasswordPlaceholder')}
            value={form.currentPassword}
            onChange={value => updateField('currentPassword', value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <PasswordField
                label={t('newPassword')}
                placeholder={t('newPasswordPlaceholder')}
                value={form.newPassword}
                ariaDescribedBy="new-password-hint"
                onChange={value => updateField('newPassword', value)}
              />
              <span id="new-password-hint" className="text-[0.7rem] text-base-content/60 px-1">
                {t('passwordHint')}
              </span>
            </div>
            <PasswordField
              label={t('confirmPassword')}
              placeholder={t('confirmPasswordPlaceholder')}
              value={form.confirmPassword}
              hasError={isConfirmMismatch}
              errorText={isConfirmMismatch ? t('mismatchError') : undefined}
              onChange={value => updateField('confirmPassword', value)}
            />
          </div>

          {error && <FormAlert type="error" message={error} />}
          {success && <FormAlert type="success" message={success} />}

          <div className="form-control mt-4">
            <button
              type="submit"
              className="btn btn-primary w-full sm:w-auto sm:self-end min-w-[150px]"
              disabled={loading}
              aria-label={loading ? t('saving') : t('saveChanges')}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  {t('saving')}
                </>
              ) : (
                t('saveChanges')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page Component (Composition Root) ───────────────────────────────────────

export default function ChangePasswordPage({ profile }: ChangePasswordPageProps) {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-base-200 p-4 md:p-8 flex justify-center items-start pt-10 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50 animate-pulse" />
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-secondary/10 rounded-full blur-3xl opacity-40 animate-pulse [animation-delay:1s]" />
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 relative z-0">
        <div className="md:col-span-1">
          <UserProfileCard profile={profile} />
        </div>
        <div className="md:col-span-2">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
