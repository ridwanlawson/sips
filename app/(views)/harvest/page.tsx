import type { Metadata } from 'next';
import HarvestWrapper from './harvest-wrapper';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Harvesting' };
}

export default function Page() {
  return <HarvestWrapper />;
}
