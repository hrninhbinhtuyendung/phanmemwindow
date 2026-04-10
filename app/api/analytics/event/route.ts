import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';

type EventType = 'search' | 'software_view' | 'download_open';

function clampString(value: unknown, maxLen: number) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

function clampId(value: unknown) {
  const v = clampString(value, 64);
  if (!v) return null;
  // Loose check (uuid or other short ids)
  if (!/^[a-z0-9-]{16,64}$/i.test(v)) return null;
  return v;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  const bodyObj: Record<string, unknown> =
    body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};

  const eventTypeRaw = clampString(bodyObj.type, 32) as EventType | null;
  const allowed: EventType[] = ['search', 'software_view', 'download_open'];
  if (!eventTypeRaw || !allowed.includes(eventTypeRaw)) {
    return NextResponse.json({ error: 'INVALID_TYPE' }, { status: 400 });
  }

  const id = clampId(bodyObj.id) ?? crypto.randomUUID();
  const sessionId = clampId(bodyObj.sessionId);
  const searchId = clampId(bodyObj.searchId);
  const softwareId = clampId(bodyObj.softwareId);
  const route = clampString(bodyObj.route, 200);
  const query = clampString(bodyObj.query, 200);

  const data =
    bodyObj.data && typeof bodyObj.data === 'object' && !Array.isArray(bodyObj.data)
      ? (bodyObj.data as Record<string, unknown>)
      : null;

  if (data) {
    const encoded = JSON.stringify(data);
    if (Buffer.byteLength(encoded, 'utf8') > 8_000) {
      return NextResponse.json({ error: 'DATA_TOO_LARGE' }, { status: 413 });
    }
  }

  const userAgent = clampString(request.headers.get('user-agent'), 256);
  const referer = clampString(request.headers.get('referer'), 300);

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('analytics_events').insert([
      {
        id,
        event_type: eventTypeRaw,
        session_id: sessionId,
        search_id: searchId,
        software_id: softwareId,
        route,
        query,
        user_agent: userAgent,
        referer,
        data,
      },
    ]);

    if (error) {
      console.error('analytics insert error:', error);
      return NextResponse.json({ error: 'INSERT_FAILED' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error('analytics exception:', error);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}
