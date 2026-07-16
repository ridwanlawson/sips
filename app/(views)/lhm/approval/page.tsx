import type { Metadata } from 'next';
import ApprovalClient from './approval-client';

export const metadata: Metadata = { title: 'Persetujuan LHM' };

export default function Page() {
  return <ApprovalClient />;
}
