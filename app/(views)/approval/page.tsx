import type { Metadata } from 'next';
import ApprovalWrapper from './approval-wrapper';

export const metadata: Metadata = { title: 'Persetujuan' };

export default function Page() {
  return <ApprovalWrapper />;
}
