'use client';
import { PageError } from '@/app/components/ui/page-error';
export default function ApprovalLhmError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError error={error} reset={reset} />;
}
