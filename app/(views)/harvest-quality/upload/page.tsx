import type { Metadata } from 'next';
import HarvestQualityUploadWrapper from './harvest-quality-upload-wrapper';

export const metadata: Metadata = { title: 'Upload Harvesting Quality' };

export default function Page() {
  return <HarvestQualityUploadWrapper />;
}

