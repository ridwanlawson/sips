'use client';

import dynamic from 'next/dynamic';

// Navbar di-lazy load karena bukan bagian dari LCP (konten utama lebih penting)
// Ini mengurangi JS yang di-parse saat first load
const Navbar = dynamic(() => import('../components/navbar'), {
  ssr: false,
  loading: () => <div className="navbar bg-base-100 shadow-sm h-16" aria-hidden="true" />,
});

export default function NavbarWrapper() {
  return <Navbar />;
}
