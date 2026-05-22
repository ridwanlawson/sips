'use client';

import dynamic from 'next/dynamic';
import { SkeletonTable } from '@/app/components/skeletons';

// Lazy load the large component so it is not part of the initial bundle.
const Attendance = dynamic(() => import('./attendance-client'), {
  ssr: false,
  loading: () => (
    <div className="p-6">
      <SkeletonTable rows={10} />
    </div>
  ),
});

export default function AttendanceWrapper() {
  return <Attendance />;
}
