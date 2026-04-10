import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isAdminRequest } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import type { SoftwareSubmissionRow } from '@/types/supabase';

function unauthorized() {
  return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
}

function schemaHint(message: string) {
  if (!message.toLowerCase().includes('schema cache')) return null;
  const missingColumnMatch = message.match(/Could not find the '([^']+)' column/i);
  const column = missingColumnMatch?.[1];
  if (!column) return null;

  const isJsonArray =
    column === 'install_images' || column.endsWith('_images') || column.endsWith('_urls');
  const sql = isJsonArray
    ? [
        `ALTER TABLE software_submissions ADD COLUMN IF NOT EXISTS ${column} JSONB DEFAULT '[]'::jsonb;`,
        `NOTIFY pgrst, 'reload schema';`,
      ].join('\n')
    : [
        `ALTER TABLE software_submissions ADD COLUMN IF NOT EXISTS ${column} TEXT;`,
        `NOTIFY pgrst, 'reload schema';`,
      ].join('\n');

  return {
    column,
    sql,
  };
}

export async function GET(request: Request) {
  if (!isAdminRequest(await cookies())) return unauthorized();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // all|pending|approved|rejected

  try {
    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin.from('software_submissions').select('*');
    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      const hint = schemaHint(error.message);
      return NextResponse.json(
        hint ? { error: error.message, hint } : { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json((data as SoftwareSubmissionRow[]) || []);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(await cookies())) return unauthorized();

  const body = (await request.json().catch(() => null)) as
    | {
        title?: string;
        description?: string;
        category?: string;
        version?: string;
        image_url?: string;
        download_url?: string;
        download_url_2?: string;
        install_guide?: string;
        video_url?: string;
        install_images?: (string | null)[];
      }
    | null;

  const title = body?.title?.trim() ?? '';
  const description = body?.description?.trim() ?? '';
  const category = body?.category?.trim() ?? 'Khác';
  const version = body?.version?.trim() ?? null;
  const image_url = body?.image_url?.trim() ?? '/placeholder-software.svg';
  const download_url = body?.download_url?.trim() ?? null;
  const download_url_2 = body?.download_url_2?.trim() ?? null;
  const install_guide = body?.install_guide?.trim() ?? null;
  const video_url = body?.video_url?.trim() ?? null;
  const install_images = Array.isArray(body?.install_images)
    ? body!.install_images!.map((u) => {
        if (typeof u !== 'string') return null;
        const trimmed = u.trim();
        return trimmed.length > 0 ? trimmed : null;
      })
    : [];

  if (!title) {
    return NextResponse.json({ error: 'TITLE_REQUIRED' }, { status: 400 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('software_submissions')
      .insert([
        {
          title,
          description,
          category,
          version,
          image_url,
          download_url,
          download_url_2,
          install_guide,
          video_url,
          install_images,
          rating: 0,
          likes: 0,
          comments: 0,
          views: 0,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      const hint = schemaHint(error.message);
      return NextResponse.json(
        hint ? { error: error.message, hint } : { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data as SoftwareSubmissionRow);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
