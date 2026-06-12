'use client';

import dynamic from 'next/dynamic';
import { SkeletonTable } from '@/app/components/skeletons';

const HarvestingQualityUploadPage = dynamic(() => import('./harvestingqualityuploadpage-client'), {
  
  loading: () => (
    <div className="p-6">
      <SkeletonTable rows={10} />
    </div>
  ),
});

export default function HarvestingQualityUploadWrapper() {
  return <HarvestingQualityUploadPage />;
}
