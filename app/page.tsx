'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import SoftwareCard from '@/components/SoftwareCard';
import { Software } from '@/types/software';
import { softwareData } from '@/data/software';
import { trackSearch } from '@/lib/analytics-client';

type SortMode = 'newest' | 'mostViewed' | 'topRated' | 'mostLiked';

function parseViDateToMs(value: string | undefined) {
  if (!value) return 0;
  const match = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return 0;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [software, setSoftware] = useState<Software[]>(softwareData);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>('newest');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchSoftware = async () => {
      try {
        const response = await fetch('/api/software');
        const data = await response.json();
        setSoftware(Array.isArray(data) ? data : softwareData);
      } catch (error) {
        console.error('Error fetching software:', error);
        setSoftware(softwareData);
      } finally {
        setLoading(false);
      }
    };

    fetchSoftware();
  }, []);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const response = await fetch('/api/admin/me');
        const data = await response.json();
        setIsAdmin(Boolean(data?.isAdmin));
      } catch {
        setIsAdmin(false);
      }
    };
    fetchAdmin();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(software.map((s) => s.category))).filter(Boolean),
    [software]
  );

  const filteredSoftware = useMemo(() => {
    const filtered = software.filter((soft) => {
      const matchesSearch =
        (soft.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (soft.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === '' || soft.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'mostViewed':
          return (b.views || 0) - (a.views || 0);
        case 'topRated':
          return (b.rating || 0) - (a.rating || 0);
        case 'mostLiked':
          return (b.likes || 0) - (a.likes || 0);
        case 'newest':
        default:
          return parseViDateToMs(b.datePublished) - parseViDateToMs(a.datePublished);
      }
    });
  }, [searchQuery, selectedCategory, software, sort]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) return;

    const timer = window.setTimeout(() => {
      trackSearch({
        query,
        resultsCount: filteredSoftware.length,
        category: selectedCategory,
        sort,
      });
    }, 600);

    return () => window.clearTimeout(timer);
  }, [searchQuery, selectedCategory, sort, filteredSoftware.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header
        className="relative overflow-hidden bg-[#050B2E] text-white"
        style={{
          backgroundImage:
            'radial-gradient(closest-side at 50% 55%, rgba(34,211,238,0.35), transparent 70%), radial-gradient(closest-side at 18% 28%, rgba(56,189,248,0.18), transparent 65%), radial-gradient(closest-side at 82% 18%, rgba(59,130,246,0.16), transparent 65%), linear-gradient(135deg, #050B2E 0%, #07103A 45%, #020617 100%)',
        }}
      >
        <style jsx>{`
          @keyframes heroShift {
            0% {
              transform: translate3d(0, 0, 0);
            }
            50% {
              transform: translate3d(-2%, 1.5%, 0);
            }
            100% {
              transform: translate3d(0, 0, 0);
            }
          }
          @keyframes heroFloat {
            0% {
              transform: translate3d(0, 0, 0);
            }
            50% {
              transform: translate3d(0, -8px, 0);
            }
            100% {
              transform: translate3d(0, 0, 0);
            }
          }
        `}</style>

        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(to bottom right, rgba(255,255,255,0.20), transparent 55%), radial-gradient(closest-side, rgba(255,255,255,0.30), transparent), radial-gradient(closest-side, rgba(99,102,241,0.45), transparent)',
            backgroundPosition: '0% 0%, 18% 22%, 84% 8%',
            backgroundSize: 'auto, 720px 720px, 620px 620px',
            animation: 'heroShift 10s ease-in-out infinite',
          }}
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/20 blur-3xl"
          style={{ animation: 'heroFloat 8s ease-in-out infinite' }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-28 left-1/3 h-80 w-80 rounded-full bg-cyan-300/25 blur-3xl"
          style={{ animation: 'heroFloat 10s ease-in-out infinite' }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -top-28 right-[-3rem] h-96 w-96 rounded-full bg-sky-300/20 blur-3xl"
          style={{ animation: 'heroFloat 12s ease-in-out infinite' }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(1200px 500px at 50% 100%, rgba(34,211,238,0.22), transparent 60%), radial-gradient(900px 420px at 50% 0%, rgba(56,189,248,0.10), transparent 60%)',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(closest-side, rgba(255,255,255,0.35), transparent), radial-gradient(closest-side, rgba(255,255,255,0.20), transparent)',
            backgroundPosition: '20% 30%, 80% 10%',
            backgroundSize: '700px 700px, 600px 600px',
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 pt-6 pb-24 md:pt-8 md:pb-28">
          <div className="max-w-3xl">
            <h1 className="text-xl md:text-3xl font-extrabold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
              Khám phá phần mềm chất lượng, tải nhanh, an toàn
            </h1>
            <p className="text-blue-100 mt-2 text-sm md:text-base">
              Tìm kiếm theo danh mục, xem đánh giá, và tải về chỉ với vài cú click.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {isAdmin ? (
                <>
                  <Link
                    href="/admin"
                    className="inline-flex items-center justify-center rounded-xl bg-white text-blue-800 px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-blue-50 transition"
                  >
                    Tải lên phần mềm
                  </Link>
                  <Link
                    href="/admin-panel"
                    className="inline-flex items-center justify-center rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold ring-1 ring-white/25 hover:bg-white/15 transition"
                  >
                    Bảng duyệt
                  </Link>
                </>
              ) : null}
            </div>

          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="relative z-10 -mt-16
         md:-mt-17 lg:-mt-21">
          <SearchBar
            onSearch={setSearchQuery}
            onCategoryChange={setSelectedCategory}
            onSortChange={(value) => setSort(value as SortMode)}
            categories={categories}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden animate-pulse"
              >
                <div className="bg-gray-200 aspect-[16/10]" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded" />
                  <div className="h-4 w-2/3 bg-gray-200 rounded" />
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-gray-600">
                Tìm thấy{' '}
                <span className="font-bold text-blue-700">
                  {filteredSoftware.length}
                </span>{' '}
                phần mềm
                {selectedCategory && (
                  <span className="text-gray-500"> • {selectedCategory}</span>
                )}
              </p>
              <p className="text-sm text-gray-500">
                Mẹo: thử tìm “CAD”, “Photoshop”, “VS Code”...
              </p>
            </div>

            {filteredSoftware.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSoftware.map((soft) => (
                  <SoftwareCard key={soft.id} software={soft} />
                ))}
              </div>
            ) : (
              <div className="text-center py-14 bg-white rounded-2xl shadow-sm ring-1 ring-black/5">
                <p className="text-xl font-semibold text-gray-800">
                  Không tìm thấy phần mềm nào
                </p>
                <p className="text-gray-500 mt-2">
                  Thử từ khóa khác hoặc tải lên phần mềm đầu tiên của bạn.
                </p>
                <div className="mt-6">
                  <Link
                    href="/admin"
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    Đi tới trang Upload
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
