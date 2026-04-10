import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      className="mt-auto border-t border-white/10 text-white"
      style={{
        backgroundImage:
          'radial-gradient(closest-side at 50% 20%, rgba(34,211,238,0.16), transparent 70%), radial-gradient(closest-side at 12% 80%, rgba(56,189,248,0.10), transparent 65%), radial-gradient(closest-side at 88% 70%, rgba(59,130,246,0.10), transparent 65%), linear-gradient(135deg, #050B2E 0%, #07103A 45%, #020617 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white shadow-sm ring-1 ring-white/15 backdrop-blur">
                PW
              </span>
              <span className="text-lg">PhanMemWindow</span>
            </div>
            <p className="mt-2 text-sm text-white/75 max-w-xl">
              Nền tảng chia sẻ phần mềm với trải nghiệm hiện đại, tìm kiếm nhanh và giao diện thân thiện.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <Link href="/" className="text-white/85 hover:text-white transition">
              Trang chủ
            </Link>
            <Link
              href="/admin-login"
              className="text-white/85 hover:text-white transition"
            >
              Khu vực Admin
            </Link>
            <a
              href="mailto:contact@phanmemwindow.local"
              className="text-white/85 hover:text-white transition"
            >
              Liên hệ
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-sm text-white/65 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PhanMemWindow. All rights reserved.</p>
          <p className="text-white/45">Made with Next.js + Supabase</p>
        </div>
      </div>
    </footer>
  );
}
