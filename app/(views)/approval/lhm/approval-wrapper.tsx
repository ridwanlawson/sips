'use client';

import dynamic from 'next/dynamic';
import { SkeletonTable } from '@/app/components/skeletons';

const Approval = dynamic(() => import('./approval-client'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[calc(100vh-64px)] bg-base-200 w-full">
      <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto w-full">
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
          <div className="skeleton h-9 w-36 rounded-lg" />
          <div className="flex justify-start sm:justify-end gap-2 flex-wrap">
            <div className="skeleton h-8 w-28 rounded-lg" />
            <div className="skeleton h-8 w-20 rounded-lg" />
            <div className="skeleton h-8 w-20 rounded-lg" />
            <div className="skeleton h-8 w-28 rounded-lg" />
          </div>
        </div>
        <div className="mb-3 flex justify-end">
          <div className="skeleton h-10 w-full md:w-96 rounded-lg" />
        </div>
        <div className="rounded-lg border border-base-200 shadow-sm bg-base-100 p-4">
          <SkeletonTable rows={10} />
        </div>
      </div>
    </div>
  ),
});

export default function ApprovalWrapper() {
  return <Approval />;
}
