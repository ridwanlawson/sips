import type { Metadata } from 'next';
import DashboardWrapper from './dashboard-wrapper';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Dashboard' };
}

export default function Page() {
  return <DashboardWrapper />;
}
