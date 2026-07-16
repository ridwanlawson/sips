import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Persetujuan' };

export default function Page() {
  redirect('/lhm/approval');
}
