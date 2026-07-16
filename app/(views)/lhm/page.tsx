import type { Metadata } from 'next';
import LhmClient from './lhm-client';

export const metadata: Metadata = { title: 'LHM' };

export default function Page() {
  return <LhmClient />;
}
