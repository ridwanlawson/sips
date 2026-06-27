'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { isValidRedirect } from '@/utils/sanitization';

const LOADING_TIPS = [
  'Pastikan username dan password sudah benar.',
  'Jaga kerahasiaan akun Anda, jangan dibagikan ke orang lain.',
  'Hubungi Administrator jika lupa kata sandi.',
  'Gunakan koneksi internet yang stabil untuk pengalaman terbaik.',
];

type Firefly = {
  top: number;
  left: number;
  duration: number;
  delay: number;
  size: number;
};

export default function Home() {
  const router = useRouter();
  const tAuth = useTranslations('Auth');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const searchParams = useSearchParams();

  const rawRedirect = searchParams.get('redirect');
  const redirectTo = isValidRedirect(rawRedirect) ? (rawRedirect as string) : '/dashboard';

  // SECURITY: Hapus localStorage untuk mencegah XSS
  // useEffect(() => {
  //   const saved = window.localStorage.getItem('sips_saved_login');
  //   if (!saved) return;
  //   try {
  //     const parsed = JSON.parse(saved) as { username?: string };
  //     if (parsed.username) {
  //       setUsername(parsed.username);
  //       setSaveUsername(true);
  //     }
  //   } catch {
  //     window.localStorage.removeItem('sips_saved_login');
  //   }
  // }, []);

  // useEffect(() => {
  //   if (saveUsername) {
  //     window.localStorage.setItem('sips_saved_login', JSON.stringify({ username }));
  //   } else {
  //     window.localStorage.removeItem('sips_saved_login');
  //   }
  // }, [saveUsername, username]);

  // Generate fireflies sekali saja (random posisi/ukuran)
  const [fireflies, setFireflies] = useState<Firefly[]>([]);

  useEffect(() => {
    setFireflies(
      Array.from({ length: 24 }, () => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        duration: 10 + Math.random() * 10,
        delay: Math.random() * 8,
        size: 4 + Math.random() * 6,
      }))
    );
  }, []);

  // Rotasi tips saat loading
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => setTipIndex(prev => (prev + 1) % LOADING_TIPS.length), 2200);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    setIsCapsLock(e.getModifierState('CapsLock'));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Get CSRF token from cookie
      const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1];

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({ username: username.toLowerCase(), password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(redirectTo);
      } else {
        setError(data.message || 'Login gagal. Silakan periksa kembali kredensial Anda.');
        setIsLoading(false);
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 bg-base-200 overflow-hidden">
      {/* Decorative animated background blobs + fireflies */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 top-10 h-64 w-64 bg-primary/20 blur-3xl animate-pulse" />
        <div className="absolute -right-32 bottom-10 h-72 w-72 bg-secondary/20 blur-3xl animate-pulse [animation-delay:400ms]" />
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 bg-accent/10 blur-3xl opacity-70 animate-pulse [animation-duration:4s]" />

        {/* Fireflies */}
        {fireflies.map((f, idx) => (
          <span
            key={idx}
            aria-hidden="true"
            className="firefly"
            style={{
              top: `${f.top}%`,
              left: `${f.left}%`,
              width: `${f.size}px`,
              height: `${f.size}px`,
              animationDuration: `${f.duration}s, 2.4s`,
              animationDelay: `${f.delay}s, ${f.delay / 2}s`,
            }}
          />
        ))}
      </div>

      {/* Loading Overlay - Smooth fade effect + tips */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="flex flex-col items-center gap-4 px-6 py-4 rounded-2xl bg-base-100/90 shadow-lg">
            <span className="loading loading-spinner loading-lg text-primary" />
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-base-content">Memverifikasi kredensial...</p>
              <p className="text-xs text-base-content/70 animate-fadeIn">
                {LOADING_TIPS[tipIndex]}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Konten utama */}
      <main
        id="main-content"
        tabIndex={-1}
        className="relative z-10 flex flex-col sm:flex-row gap-10 sm:gap-16 row-start-2 items-center sm:items-center focus:outline-none"
      >
        {/* Left side text / highlight */}
        <section className="hidden sm:flex flex-col gap-3 max-w-xs animate-fadeIn [animation-duration:700ms]">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary/80 uppercase">
            SIPS MOBILE WEB
          </p>
          <h1 className="text-2xl font-bold leading-snug">
            Masuk untuk memantau
            <span className="text-primary"> aktivitas lapangan</span> dengan lebih mudah.
          </h1>
          <p className="text-sm text-base-content/70">
            Sistem terintegrasi untuk absensi, aktivitas harian, dan kontrol operasional di Estate.
            Login dengan akun yang diberikan oleh Administrator.
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-base-content/60">
            <span className="status status-success inline-block animate-pulse [animation-duration:2s]" />
            <span>Realtime • Terintegrasi • Multi-Device</span>
          </div>

          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://skj.my.id/app_archive.asp"
            className="mt-4 inline-flex items-center gap-3 rounded-2xl bg-base-100/80 px-3 py-2 shadow-md animate-bounce transition hover:bg-base-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary outline-none"
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5 text-primary"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <div className="text-[0.7rem] leading-snug">
              <p className="font-semibold text-base-content">
                Download SIPS Mobile & Geo Lens Now!
              </p>
            </div>
          </a>
        </section>

        {/* Login Card */}
        <div className="card bg-base-100 card-border border-base-300 card-sm overflow-hidden shadow-lg shadow-base-300/40 animate-fadeIn [animation-duration:600ms] [animation-delay:150ms] transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
          <div className="border-base-300 border-b border-dashed">
            <div className="flex items-center gap-2 p-4">
              <div className="grow flex items-center gap-2">
                <Image
                  src="/logo.svg"
                  alt="SIPS Logo"
                  width={32}
                  height={32}
                  className="opacity-90 animate-pulse [animation-duration:2.2s]"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold tracking-[0.22em] text-primary/80">
                    LOGIN
                  </span>
                  <span className="text-sm font-medium">SIPS MOBILE WEB</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="card-body gap-4">
            <p className="text-xs opacity-60">
              Ask your administrator for your account information.
            </p>

            {/* Username */}
            <div className="flex flex-col gap-1">
              <label className="input input-border flex max-w-none items-center gap-2 transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/70">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4 opacity-70"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <input
                  type="text"
                  className="grow bg-transparent outline-none"
                  placeholder="Username"
                  aria-label="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={isLoading}
                  required
                  autoFocus
                />
              </label>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="input input-border flex max-w-none items-center gap-2 transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/70">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4 opacity-70"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="grow bg-transparent outline-none"
                  placeholder="Password"
                  aria-label="Password"
                  aria-describedby="password-hint"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyDown}
                  disabled={isLoading}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="btn btn-ghost btn-square btn-xs opacity-70 hover:text-primary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </label>

              {error && (
                <span
                  role="alert"
                  aria-live="polite"
                  className="text-error flex items-center gap-2 px-1 text-[0.6875rem] animate-fadeIn [animation-duration:300ms]"
                >
                  <span className="status status-error inline-block" aria-hidden="true" />
                  {error}
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
              {!error && (
                <span
                  id="password-hint"
                  className="text-base-content/60 flex items-center gap-2 px-1 text-[0.6875rem]"
                >
                  <span
                    className="status status-warning inline-block animate-pulse [animation-duration:2s]"
                    aria-hidden="true"
                  />
                  Password must be 8+ characters
                </span>
              )}
              {/* SECURITY: Remember username disabled to prevent XSS via localStorage */}
            </div>

            {/* Actions */}
            <div className="card-actions items-center gap-6 mt-2">
              <button
                type="submit"
                className="btn btn-primary w-full transition-transform duration-200 hover:-translate-y-[1px] active:scale-95"
                disabled={isLoading}
                aria-label={isLoading ? 'Logging in...' : 'Login'}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Custom CSS for the firefly animation */}
      <style jsx global>{`
        .firefly {
          position: absolute;
          border-radius: 9999px;
          background: radial-gradient(
            circle,
            rgba(250, 250, 210, 1) 0%,
            rgba(250, 250, 210, 0.8) 30%,
            rgba(59, 130, 246, 0.3) 60%,
            rgba(59, 130, 246, 0) 100%
          );
          box-shadow: 0 0 18px rgba(250, 250, 210, 0.9);
          opacity: 0.8;
          animation-name: firefly-drift, firefly-flicker;
          animation-timing-function: ease-in-out, ease-in-out;
          animation-iteration-count: infinite, infinite;
          animation-direction: alternate, alternate;
        }

        @keyframes firefly-drift {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          25% {
            transform: translate3d(10px, -16px, 0) scale(1.1);
          }
          50% {
            transform: translate3d(-12px, -8px, 0) scale(0.95);
          }
          75% {
            transform: translate3d(8px, 12px, 0) scale(1.05);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes firefly-flicker {
          0% {
            opacity: 0.2;
          }
          20% {
            opacity: 0.9;
          }
          40% {
            opacity: 0.4;
          }
          60% {
            opacity: 1;
          }
          80% {
            opacity: 0.3;
          }
          100% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
