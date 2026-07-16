import type { Metadata } from 'next';
import AttendanceWrapper from './attendance-wrapper';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Absensi' };
}

export default function Page() {
  return <AttendanceWrapper />;
}
