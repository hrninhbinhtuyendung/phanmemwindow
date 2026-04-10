'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type StatsResponse = {
  since: string;
  granularity: 'day';
  timeseries: { bucket: string; searches: number; softwareViews: number; downloads: number }[];
  totals: {
    searches: number;
    softwareViews: number;
    downloads: number;
  };
  conversion: {
    searchToView: number;
    searchToDownload: number;
  };
  topKeywords: { keyword: string; count: number }[];
  topSoftwareViews: { softwareId: string; count: number }[];
  topSoftwareDownloads: { softwareId: string; count: number }[];
};

type SoftwareLite = { id: string; title: string };

function formatPct(value: number) {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.round(value * 1000) / 10}%`;
}

function formatBucketLabel(bucket: string) {
  const m = bucket.slice(5, 7);
  const d = bucket.slice(8, 10);
  return `${d}/${m}`;
}

function MiniLineChart({
  series,
}: {
  series: { bucket: string; searches: number; softwareViews: number; downloads: number }[];
}) {
  const width = 900;
  const height = 220;
  const padding = 24;

  const maxY = Math.max(
    1,
    ...series.map((p) => Math.max(p.searches, p.softwareViews, p.downloads))
  );

  const xStep = series.length > 1 ? (width - padding * 2) / (series.length - 1) : 1;
  const xAt = (i: number) => padding + i * xStep;
  const yAt = (v: number) => height - padding - (v / maxY) * (height - padding * 2);

  const pathFor = (key: 'searches' | 'softwareViews' | 'downloads') => {
    if (series.length === 0) return '';
    return series
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(2)} ${yAt(p[key]).toFixed(2)}`)
      .join(' ');
  };

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => (maxY * i) / ticks);

  return (
    <div className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-extrabold text-gray-900">Biểu đồ theo ngày</h2>
          <p className="text-xs text-gray-500 mt-1">Search, view chi tiết, mở link tải</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="inline-flex items-center gap-2 text-gray-700">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Search
          </span>
          <span className="inline-flex items-center gap-2 text-gray-700">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> View
          </span>
          <span className="inline-flex items-center gap-2 text-gray-700">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Tải
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[720px] w-full h-[240px]"
          role="img"
          aria-label="Biểu đồ thống kê theo ngày"
        >
          {yTicks.map((t) => {
            const y = yAt(t);
            return (
              <g key={t}>
                <line
                  x1={padding}
                  x2={width - padding}
                  y1={y}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text x={4} y={y + 4} fontSize="10" fill="#6b7280">
                  {Math.round(t)}
                </text>
              </g>
            );
          })}

          {series.map((p, i) => {
            const show =
              series.length <= 10 ||
              i === 0 ||
              i === series.length - 1 ||
              i % 3 === 0;
            if (!show) return null;
            return (
              <text
                key={p.bucket}
                x={xAt(i)}
                y={height - 6}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {formatBucketLabel(p.bucket)}
              </text>
            );
          })}

          <path d={pathFor('searches')} fill="none" stroke="#0ea5e9" strokeWidth="2.5" />
          <path d={pathFor('softwareViews')} fill="none" stroke="#6366f1" strokeWidth="2.5" />
          <path d={pathFor('downloads')} fill="none" stroke="#10b981" strokeWidth="2.5" />

          {series.length > 0 ? (
            <>
              {(['searches', 'softwareViews', 'downloads'] as const).map((k) => {
                const last = series[series.length - 1];
                const color =
                  k === 'searches'
                    ? '#0ea5e9'
                    : k === 'softwareViews'
                      ? '#6366f1'
                      : '#10b981';
                return (
                  <circle
                    key={k}
                    cx={xAt(series.length - 1)}
                    cy={yAt(last[k])}
                    r="4"
                    fill={color}
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
            </>
          ) : null}
        </svg>
      </div>
    </div>
  );
}

export default function AdminStatsPage() {
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [softwareList, setSoftwareList] = useState<SoftwareLite[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/software')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('FETCH_SOFTWARE_FAILED'))))
      .then((data) => {
        if (cancelled) return;
        const mapped = Array.isArray(data)
          ? data
              .map((x: unknown) => {
                const obj =
                  x && typeof x === 'object' && !Array.isArray(x)
                    ? (x as Record<string, unknown>)
                    : {};
                return {
                  id: String(obj.id ?? ''),
                  title: String(obj.title ?? ''),
                };
              })
              .filter((x: SoftwareLite) => x.id && x.title)
          : [];
        setSoftwareList(mapped);
      })
      .catch(() => {
        // Best-effort mapping only.
        if (!cancelled) setSoftwareList([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const softwareTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of softwareList) map.set(s.id, s.title);
    return map;
  }, [softwareList]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    fetch(`/api/admin/stats?days=${encodeURIComponent(String(days))}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data: StatsResponse) => {
        if (cancelled) return;
        setStats(data);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e));
        setStats(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [days]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-gray-900">Thống kê</h1>
            <p className="text-sm text-gray-600 mt-1">
              Lượt xem, lượt tải, conversion từ tìm kiếm, từ khóa hot
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin-panel"
              className="inline-flex px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
            >
              ← Quay lại duyệt
            </Link>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Khoảng thời gian"
            >
              <option value={1}>24 giờ</option>
              <option value={7}>7 ngày</option>
              <option value={30}>30 ngày</option>
              <option value={90}>90 ngày</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-5 animate-pulse"
              >
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-8 w-28 bg-gray-200 rounded mt-3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-6">
            <p className="font-bold text-gray-900">Không tải được thống kê</p>
            <p className="text-sm text-gray-600 mt-2 break-all">{error}</p>
            <p className="text-sm text-gray-600 mt-3">
              Nếu bạn chưa tạo table analytics, hãy chạy thêm phần “analytics_events” trong
              `SUPABASE_SETUP.sql`.
            </p>
          </div>
        ) : stats ? (
          <>
            <MiniLineChart series={stats.timeseries || []} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-500">Tìm kiếm</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-2">
                  {stats.totals.searches}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Conversion → view: <span className="font-bold">{formatPct(stats.conversion.searchToView)}</span>
                </p>
              </div>
              <div className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-500">Lượt xem chi tiết</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-2">
                  {stats.totals.softwareViews}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Conversion → tải: <span className="font-bold">{formatPct(stats.conversion.searchToDownload)}</span>
                </p>
              </div>
              <div className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-500">Mở link tải</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-2">
                  {stats.totals.downloads}
                </p>
                <p className="text-xs text-gray-500 mt-2">Tính theo click “Mở link tải”</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
              <section className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-5">
                <h2 className="font-extrabold text-gray-900">Từ khóa hot</h2>
                <p className="text-xs text-gray-500 mt-1">Trong {days} ngày gần nhất</p>
                <div className="mt-4 space-y-2">
                  {stats.topKeywords.length === 0 ? (
                    <p className="text-sm text-gray-600">Chưa có dữ liệu.</p>
                  ) : (
                    stats.topKeywords.map((k) => (
                      <div key={k.keyword} className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-gray-800 truncate">
                          {k.keyword}
                        </span>
                        <span className="text-xs font-bold text-gray-600">{k.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-5">
                <h2 className="font-extrabold text-gray-900">Top lượt xem</h2>
                <p className="text-xs text-gray-500 mt-1">Theo page chi tiết</p>
                <div className="mt-4 space-y-2">
                  {stats.topSoftwareViews.length === 0 ? (
                    <p className="text-sm text-gray-600">Chưa có dữ liệu.</p>
                  ) : (
                    stats.topSoftwareViews.map((x) => (
                      <div key={x.softwareId} className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-gray-800 truncate">
                          {softwareTitleById.get(x.softwareId) ?? x.softwareId}
                        </span>
                        <span className="text-xs font-bold text-gray-600">{x.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-5">
                <h2 className="font-extrabold text-gray-900">Top lượt tải</h2>
                <p className="text-xs text-gray-500 mt-1">Theo click mở link tải</p>
                <div className="mt-4 space-y-2">
                  {stats.topSoftwareDownloads.length === 0 ? (
                    <p className="text-sm text-gray-600">Chưa có dữ liệu.</p>
                  ) : (
                    stats.topSoftwareDownloads.map((x) => (
                      <div key={x.softwareId} className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-gray-800 truncate">
                          {softwareTitleById.get(x.softwareId) ?? x.softwareId}
                        </span>
                        <span className="text-xs font-bold text-gray-600">{x.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
