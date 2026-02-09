"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl border border-error/20">
        <div className="card-body items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="card-title text-2xl font-bold">Something went wrong!</h2>
          <p className="text-base-content/70">
            An unexpected error occurred. We have been notified and are working to fix it.
          </p>
          <div className="card-actions w-full mt-4">
            <button
              onClick={() => reset()}
              className="btn btn-primary w-full"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.href = "/"}
              className="btn btn-ghost w-full"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
