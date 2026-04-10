import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isAdminRequest } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

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

function normalizeKeyword(value: string | null) {
  if (!value) return null;
  const cleaned = value.trim().toLowerCase().replace(/\s+/g, ' ');
  if (cleaned.length < 2) return null;
  return cleaned.length > 60 ? cleaned.slice(0, 60) : cleaned;
}

function topN(map: Map<string, number>, n: number) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  if (!isAdminRequest(cookieStore)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const url = new URL(request.url);
  const daysParam = url.searchParams.get('days');
  const days = Math.min(90, Math.max(1, Number(daysParam || '7')));
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const sinceBucket = sinceDate.toISOString().slice(0, 10);

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('analytics_events')
      .select('event_type, software_id, search_id, query, created_at')
      .gte('created_at', sinceDate.toISOString())
      .limit(50_000);

    if (error) {
      console.error('stats query error:', error);
      return NextResponse.json({ error: 'QUERY_FAILED' }, { status: 500 });
    }

    const keywordCounts = new Map<string, number>();
    const viewCounts = new Map<string, number>();
    const downloadCounts = new Map<string, number>();
    const buckets = new Map<string, { searches: number; softwareViews: number; downloads: number }>();

    const uniqueSearchIds = new Set<string>();
    const searchIdsWithView = new Set<string>();
    const searchIdsWithDownload = new Set<string>();

    let searches = 0;
    let softwareViews = 0;
    let downloads = 0;

    for (const row of data || []) {
      const eventType = row.event_type as string | null;
      const softwareId = row.software_id as string | null;
      const searchId = row.search_id as string | null;
      const query = row.query as string | null;
      const createdAt = row.created_at as string | null;
      const bucket = typeof createdAt === 'string' ? createdAt.slice(0, 10) : null;
      if (bucket && bucket >= sinceBucket) {
        if (!buckets.has(bucket)) buckets.set(bucket, { searches: 0, softwareViews: 0, downloads: 0 });
      }

      if (eventType === 'search') {
        searches += 1;
        if (searchId) uniqueSearchIds.add(searchId);
        const keyword = normalizeKeyword(query);
        if (keyword) keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
        if (bucket && buckets.has(bucket)) buckets.get(bucket)!.searches += 1;
      }

      if (eventType === 'software_view') {
        softwareViews += 1;
        if (softwareId) viewCounts.set(softwareId, (viewCounts.get(softwareId) || 0) + 1);
        if (searchId) searchIdsWithView.add(searchId);
        if (bucket && buckets.has(bucket)) buckets.get(bucket)!.softwareViews += 1;
      }

      if (eventType === 'download_open') {
        downloads += 1;
        if (softwareId) downloadCounts.set(softwareId, (downloadCounts.get(softwareId) || 0) + 1);
        if (searchId) searchIdsWithDownload.add(searchId);
        if (bucket && buckets.has(bucket)) buckets.get(bucket)!.downloads += 1;
      }
    }

    // Ensure we have continuous buckets (day granularity)
    const ts: { bucket: string; searches: number; softwareViews: number; downloads: number }[] = [];
    const now = new Date();
    const start = new Date(Date.UTC(sinceDate.getUTCFullYear(), sinceDate.getUTCMonth(), sinceDate.getUTCDate()));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      const v = buckets.get(key) ?? { searches: 0, softwareViews: 0, downloads: 0 };
      ts.push({ bucket: key, searches: v.searches, softwareViews: v.softwareViews, downloads: v.downloads });
    }

    const denom = uniqueSearchIds.size || 0;
    const response: StatsResponse = {
      since: sinceDate.toISOString(),
      granularity: 'day',
      timeseries: ts,
      totals: { searches, softwareViews, downloads },
      conversion: {
        searchToView: denom > 0 ? searchIdsWithView.size / denom : 0,
        searchToDownload: denom > 0 ? searchIdsWithDownload.size / denom : 0,
      },
      topKeywords: topN(keywordCounts, 12).map((x) => ({ keyword: x.key, count: x.count })),
      topSoftwareViews: topN(viewCounts, 12).map((x) => ({ softwareId: x.key, count: x.count })),
      topSoftwareDownloads: topN(downloadCounts, 12).map((x) => ({ softwareId: x.key, count: x.count })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('stats exception:', error);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}
