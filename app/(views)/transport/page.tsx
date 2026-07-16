import type { Metadata } from 'next';
import PengangkutanWrapper from './transport-wrapper';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Transport' };
}

export default function Page() {
  return <PengangkutanWrapper />;
}
