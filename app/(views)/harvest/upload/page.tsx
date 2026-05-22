import type { Metadata } from 'next';
import HarvestUploadWrapper from './harvest-upload-wrapper';

export const metadata: Metadata = { title: 'Upload Harvesting' };

export default function Page() {
  return <HarvestUploadWrapper />;
}
