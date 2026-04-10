import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/admin-auth';

export default async function AdminPanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  if (!isAdminRequest(cookieStore)) {
    redirect('/admin-login?next=/admin-panel');
  }
  return children;
}

