'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/admin';

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError('Sai mật khẩu hoặc chưa cấu hình ADMIN_PASSWORD.');
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError('Không thể đăng nhập. Thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-10 shadow-lg">
        <div className="max-w-xl mx-auto px-4">
          <h1 className="text-3xl font-extrabold">Đăng nhập quản trị</h1>
          <p className="text-slate-200 mt-2">
            Chỉ quản trị viên mới truy cập được Upload và Duyệt.
          </p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-10">
        <form
          onSubmit={onSubmit}
          className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6 md:p-8"
        >
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Mật khẩu admin
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập mật khẩu..."
            autoFocus
          />

          {error && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 transition disabled:bg-gray-400"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          <div className="mt-4 text-sm text-gray-600 flex justify-between">
            <Link href="/" className="hover:text-blue-700">
              ← Về trang chủ
            </Link>
            <span className="text-gray-400">/admin-login</span>
          </div>
        </form>
      </main>
    </div>
  );
}

