'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-base-200">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-error mb-4">Critical Error</h2>
            <p className="text-base-content/70 mb-6">{error.message}</p>
            <button className="btn btn-primary" onClick={reset}>
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
