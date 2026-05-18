// Footer adalah Server Component — tidak perlu "use client"
// Tahun di-hardcode agar tidak re-compute setiap render
// (new Date() di server component tetap fresh per request, tapi
//  untuk footer statis ini lebih baik di-generate saat build)
const CURRENT_YEAR = new Date().getFullYear();

export const Footer = () => (
  <footer className="footer sm:footer-horizontal footer-center text-base-content p-4">
    <aside>
      <p>Copyright © {CURRENT_YEAR} - PT. Sentosa Kalimantan Jaya</p>
    </aside>
  </footer>
);
