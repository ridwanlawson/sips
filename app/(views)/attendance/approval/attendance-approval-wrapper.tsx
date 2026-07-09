'use client';

import dynamic from 'next/dynamic';
import { SkeletonTable } from '@/app/components/skeletons';

const AttendanceApproval = dynamic(() => import('./attendance-approval-client'), {
  loading: () => (
    <div className="p-6">
      <SkeletonTable rows={10} />
    </div>
  ),
});

export default function AttendanceApprovalWrapper() {
  return <AttendanceApproval />;
}
