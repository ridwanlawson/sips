export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="text-base-content/60">Memuat aplikasi...</p>
      </div>
    </div>
  );
}
