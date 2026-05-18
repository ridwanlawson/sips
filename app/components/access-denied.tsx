/**
 * Reusable access-denied screen.
 * Eliminates the identical JSX block copy-pasted across every upload page.
 */
export function AccessDenied() {
  return (
    <div className="min-h-screen bg-base-100 p-6 flex items-center justify-center">
      <div className="text-center max-w-lg">
        <h1 className="text-3xl font-bold text-error mb-4">Akses Ditolak</h1>
        <p className="text-base-content/70 mb-6">
          Halaman ini hanya dapat diakses oleh user dengan level <b>MGR</b> atau <b>ADM</b>.
        </p>
        <a href="/dashboard" className="btn btn-primary">
          Kembali ke Dashboard
        </a>
      </div>
    </div>
  );
}
