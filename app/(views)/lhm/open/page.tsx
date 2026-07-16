import type { Metadata } from 'next';
import OpenClient from './open-client';

export const metadata: Metadata = { title: 'Buka LHM' };

export default function Page() {
  return <OpenClient />;
}
