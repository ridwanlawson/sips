import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Laporan LHM',
};

export default function Page() {
  redirect('/lhm/lhm-report');
}
