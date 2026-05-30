import type { Metadata } from 'next';
import ApprovalWrapper from './openLhm-wrapper';

export const metadata: Metadata = { title: 'Buka' };

export default function Page() {
  return <ApprovalWrapper />;
}
