import { Footer } from '../components/footer';
import NavbarWrapper from './navbar-wrapper';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <NavbarWrapper />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
