'use client';

import dynamic from 'next/dynamic';
import { SkeletonTable } from '@/app/components/ui/skeletons';

const HarvestQualityUploadPage = dynamic(() => import('./harvest-quality-upload-client'), {
  
  loading: () => (
    <div className="p-6">
      <SkeletonTable rows={10} />
    </div>
  ),
});

export default function HarvestQualityUploadWrapper() {
  return <HarvestQualityUploadPage />;
}


