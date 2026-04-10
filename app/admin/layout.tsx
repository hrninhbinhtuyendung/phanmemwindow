import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/admin-auth';

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  if (!isAdminRequest(cookieStore)) {
    redirect('/admin-login?next=/admin');
  }
  return children;
}

