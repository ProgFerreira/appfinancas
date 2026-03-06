import { redirect } from 'next/navigation';
import { getSessionUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const userId = await getSessionUserId();
  if (userId) redirect('/dashboard');
  redirect('/login');
}
