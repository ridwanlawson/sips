import type { Metadata } from 'next';
import UsersWrapper from './users-wrapper';

export const metadata: Metadata = { title: 'User Management' };

export default function Page() {
  return <UsersWrapper />;
}
