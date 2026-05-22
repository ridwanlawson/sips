import type { Metadata } from 'next';
import DashboardWrapper from './dashboard-wrapper';

export const metadata: Metadata = { title: 'Dashboard' };

export default function Page() {
  return <DashboardWrapper />;
}
