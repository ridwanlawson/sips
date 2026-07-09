import type { Metadata } from 'next';
import OpenWrapper from './open-wrapper';

export const metadata: Metadata = { title: 'Buka' };

export default function Page() {
  return <OpenWrapper />;
}
