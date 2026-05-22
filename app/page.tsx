import type { Metadata } from 'next';
import Home from './login-client';

export const metadata: Metadata = {
  title: 'Login',
};

export default function Page() {
  return <Home />;
}
