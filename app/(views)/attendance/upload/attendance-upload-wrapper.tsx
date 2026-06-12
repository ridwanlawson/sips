'use client';

import dynamic from 'next/dynamic';
import { SkeletonTable } from '@/app/components/skeletons';

const AttendanceUploadPage = dynamic(() => import('./attendanceuploadpage-client'), {
  loading: () => (
    <div className="p-6">
      <SkeletonTable rows={10} />
    </div>
  ),
});

export default function AttendanceUploadWrapper() {
  return <AttendanceUploadPage />;
}
