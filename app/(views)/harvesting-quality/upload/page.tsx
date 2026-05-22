import type { Metadata } from 'next';
import HarvestingQualityUploadWrapper from './harvesting-quality-upload-wrapper';

export const metadata: Metadata = { title: 'Upload Harvesting Quality' };

export default function Page() {
  return <HarvestingQualityUploadWrapper />;
}
