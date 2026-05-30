import type { Metadata } from 'next';
import LhmReport from './lhmreport-client';

export const metadata: Metadata = {
  title: 'Laporan LHM',
};

export default function Page() {
  return <LhmReport />;
}
