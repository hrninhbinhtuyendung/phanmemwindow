import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { isAdminRequest } from '@/lib/admin-auth';

export default async function Navigation() {
  const isAdmin = isAdminRequest(await cookies());
  return (
    <nav
      className="sticky top-0 z-50 border-b border-white/10 text-white"
      style={{
        backgroundImage:
          'radial-gradient(closest-side at 50% 55%, rgba(34,211,238,0.18), transparent 70%), radial-gradient(closest-side at 18% 28%, rgba(56,189,248,0.10), transparent 65%), radial-gradient(closest-side at 82% 18%, rgba(59,130,246,0.10), transparent 65%), linear-gradient(135deg, #050B2E 0%, #07103A 45%, #020617 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 font-bold text-white">
          <span className="relative h-9 w-9 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
            <Image
              src="/assets/icons/Logo_PW.png"
              alt="PhanMemWindow"
              fill
              sizes="36px"
              className="object-cover"
              priority
            />
          </span>
          <span className="text-lg">PhanMemWindow</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="hidden sm:inline-flex px-3 py-2 rounded-lg text-sm font-medium text-white/85 hover:text-white hover:bg-white/10 transition"
          >
            Trang chủ
          </Link>
          {isAdmin ? (
            <>
              <Link
                href="/admin"
                className="inline-flex px-3 py-2 rounded-lg text-sm font-semibold text-emerald-200 hover:bg-white/10 hover:text-emerald-100 transition"
              >
                Upload
              </Link>
              <Link
                href="/admin-panel"
                className="inline-flex px-3 py-2 rounded-lg text-sm font-semibold text-fuchsia-200 hover:bg-white/10 hover:text-fuchsia-100 transition"
              >
                Duyệt
              </Link>
              <Link
                href="/admin-panel/stats"
                className="inline-flex px-3 py-2 rounded-lg text-sm font-semibold text-sky-200 hover:bg-white/10 hover:text-sky-100 transition"
              >
                Thống kê
              </Link>
              <form action="/api/admin/logout" method="post">
                <button
                  type="submit"
                  className="inline-flex px-3 py-2 rounded-lg text-sm font-semibold text-white/85 hover:bg-white/10 hover:text-white transition"
                >
                  Thoát
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/admin-login"
              className="inline-flex px-3 py-2 rounded-lg text-sm font-semibold text-white/85 hover:bg-white/10 hover:text-white transition"
            >
              Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
