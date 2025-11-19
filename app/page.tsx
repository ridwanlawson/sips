"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const LOADING_TIPS = [
  "Pastikan username dan password sudah benar.",
  "Jaga kerahasiaan akun Anda, jangan dibagikan ke orang lain.",
  "Hubungi Administrator jika lupa kata sandi.",
  "Gunakan koneksi internet yang stabil untuk pengalaman terbaik.",
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  // Generate fireflies sekali saja (random posisi/ukuran)
  const [fireflies] = useState<Firefly[]>(() =>
    Array.from({ length: 24 }, () => ({
      top: Math.random() * 100, // 0–100% vh
      left: Math.random() * 100, // 0–100% vw
      duration: 10 + Math.random() * 10, // 10–20s
      delay: Math.random() * 8, // 0–8s
      size: 4 + Math.random() * 6, // 4–10px
    }))
  );

  // Rotasi tips saat loading
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(
      () => setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length),
      2200
    );
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: username.toLowerCase(), password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/dashboard");
      } else {
        setError(
          data.message ||
            "Login gagal. Silakan periksa kembali kredensial Anda."
        );
        setIsLoading(false);
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
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
              <p className="text-sm font-semibold text-base-content">
                Memverifikasi kredensial...
              </p>
              <p className="text-xs text-base-content/70 animate-fadeIn">
                {LOADING_TIPS[tipIndex]}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Konten utama */}
      <main className="relative z-10 flex flex-col sm:flex-row gap-10 sm:gap-16 row-start-2 items-center sm:items-center">
        {/* Left side text / highlight */}
        <section className="hidden sm:flex flex-col gap-3 max-w-xs animate-fadeIn [animation-duration:700ms]">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary/80 uppercase">
            SIPS MOBILE WEB
          </p>
          <h1 className="text-2xl font-bold leading-snug">
            Masuk untuk memantau
            <span className="text-primary"> aktivitas lapangan</span> dengan
            lebih mudah.
          </h1>
          <p className="text-sm text-base-content/70">
            Sistem terintegrasi untuk absensi, aktivitas harian, dan kontrol
            operasional di Estate. Login dengan akun yang diberikan oleh
            Administrator.
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-base-content/60">
            <span className="status status-success inline-block animate-pulse [animation-duration:2s]" />
            <span>Realtime • Terintegrasi • Multi-Device</span>
          </div>

          <div className="mt-4 inline-flex items-center gap-3 rounded-2xl bg-base-100/80 px-3 py-2 shadow-md animate-bounce">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-5 w-5 text-primary"
              >
                <path d="M8 1a3 3 0 0 0-3 3v1.5H3.75A1.75 1.75 0 0 0 2 7.25v5A1.75 1.75 0 0 0 3.75 14h8.5A1.75 1.75 0 0 0 14 12.25v-5A1.75 1.75 0 0 0 12.25 5.5H11V4a3 3 0 0 0-3-3ZM6.5 5.5V4a1.5 1.5 0 0 1 3 0v1.5h-3Z" />
              </svg>
            </div>
            <div className="text-[0.7rem] leading-snug">
              <p className="font-semibold text-base-content">
                Mandor siap pantau lapangan
              </p>
              <p className="text-base-content/60">
                Login sebentar, kontrol seharian.
              </p>
            </div>
          </div>
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
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-4 w-4 opacity-70"
                >
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                </svg>
                <input
                  type="text"
                  className="grow bg-transparent outline-none"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-4 w-4 opacity-70"
                >
                  <path
                    fillRule="evenodd"
                    d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  type="password"
                  className="grow bg-transparent outline-none"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={8}
                />
              </label>

              {error && (
                <span className="text-error flex items-center gap-2 px-1 text-[0.6875rem] animate-fadeIn [animation-duration:300ms]">
                  <span className="status status-error inline-block" />
                  {error}
                </span>
              )}
              {!error && (
                <span className="text-base-content/60 flex items-center gap-2 px-1 text-[0.6875rem]">
                  <span className="status status-warning inline-block animate-pulse [animation-duration:2s]" />
                  Password must be 8+ characters
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="card-actions items-center gap-6 mt-2">
              <button
                type="submit"
                className="btn btn-primary w-full transition-transform duration-200 hover:-translate-y-[1px] active:scale-95"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "Login"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Custom CSS untuk animasi kunang-kunang */}
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
