import type { Metadata } from 'next';
import PengangkutanWrapper from './transport-wrapper';

export const metadata: Metadata = { title: 'Transport' };

export default function Page() {
  return <PengangkutanWrapper />;
}
