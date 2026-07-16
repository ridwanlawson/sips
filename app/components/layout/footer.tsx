// Footer is a Server Component and does not need "use client".
// Keep the year in one place for this static footer.
const CURRENT_YEAR = new Date().getFullYear();

export const Footer = () => (
  <footer className="footer sm:footer-horizontal footer-center text-base-content p-4">
    <aside>
      <p>Copyright &copy; {CURRENT_YEAR} - PT. Sentosa Kalimantan Jaya</p>
    </aside>
  </footer>
);
