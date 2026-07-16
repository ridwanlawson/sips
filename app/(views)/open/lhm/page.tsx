import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Buka' };

export default function Page() {
  redirect('/lhm/open');
}
