import type { Metadata } from 'next';
import PengangkutanWrapper from './pengangkutan-wrapper';

export const metadata: Metadata = { title: 'Pengangkutan' };

export default function Page() {
  return <PengangkutanWrapper />;
}
