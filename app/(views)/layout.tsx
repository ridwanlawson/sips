import { Footer } from '../components/layout/footer';
import NavbarWrapper from './navbar-wrapper';
import ScrollToTop from '../components/ui/scroll-to-top';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <NavbarWrapper />
      <main id="main-content" tabIndex={-1} className="flex-grow focus:outline-none">
        {children}
      </main>
      <ScrollToTop />
      <Footer />
    </div>
  );
}

