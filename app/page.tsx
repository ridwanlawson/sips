"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        // Redirect to dashboard - token is now handled by the server
        router.push("/dashboard/user");
      } else {
        setError(
          data.message || "Login failed. Please check your credentials."
        );
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="card bg-base-100 card-border border-base-300 card-sm overflow-hidden">
          <div className="border-base-300 border-b border-dashed">
            <div className="flex items-center gap-2 p-4">
              <div className="grow">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Image
                    src="/logo.svg"
                    alt="SIPS Logo"
                    width={32}
                    height={32}
                    className="opacity-90"
                  />
                  LOGIN SIPS MOBILE WEB
                </div>
              </div>
            </div>
          </div>
          <form onSubmit={handleLogin} className="card-body gap-4">
            <p className="text-xs opacity-60">
              Ask your administrator for your account information.
            </p>
            <div className="flex flex-col gap-1">
              <label className="input input-border flex max-w-none items-center gap-2">
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
                  className="grow"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </label>
            </div>
            <div className="flex flex-col gap-1">
              <label className="input input-border flex max-w-none items-center gap-2">
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
                  className="grow"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </label>
              {error && (
                <span className="text-error flex items-center gap-2 px-1 text-[0.6875rem]">
                  <span className="status status-error inline-block" />
                  {error}
                </span>
              )}
              {!error && (
                <span className="text-base-content/60 flex items-center gap-2 px-1 text-[0.6875rem]">
                  <span className="status status-warning inline-block" />
                  Password must be 8+ characters
                </span>
              )}
            </div>
            <div className="card-actions items-center gap-6">
              <button
                type="submit"
                className="btn btn-primary w-full"
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
    </div>
  );
}
