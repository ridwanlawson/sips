import type { Metadata } from 'next';
import OpenWrapper from './openLhm-wrapper';

export const metadata: Metadata = { title: 'Buka' };

export default function Page() {
  return <OpenWrapper />;
}
