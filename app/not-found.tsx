import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300">
        <div className="card-body items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-2">
            <span className="text-4xl">🔍</span>
          </div>
          <h2 className="card-title text-2xl font-bold">404</h2>
          <p className="text-base-content/70">Halaman yang Anda cari tidak ditemukan.</p>
          <div className="card-actions w-full mt-4">
            <Link href="/" className="btn btn-primary w-full">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
