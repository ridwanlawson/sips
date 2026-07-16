'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-base-200">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-error mb-4">Something went wrong!</h2>
        <p className="text-base-content/70 mb-6">{error.message}</p>
        <button className="btn btn-primary" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
