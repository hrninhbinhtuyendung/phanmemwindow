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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(await cookies())) return unauthorized();
  const { id } = await params;

  const body = (await request.json().catch(() => null)) as
    | Partial<
        Pick<
          SoftwareSubmissionRow,
          | 'status'
          | 'title'
          | 'description'
          | 'category'
          | 'version'
          | 'download_url'
          | 'download_url_2'
          | 'install_guide'
          | 'video_url'
          | 'install_images'
          | 'image_url'
        >
      >
    | null;

  if (!body || Object.keys(body).length === 0) {
    return NextResponse.json({ error: 'EMPTY_BODY' }, { status: 400 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('software_submissions')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(await cookies())) return unauthorized();
  const { id } = await params;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('software_submissions')
      .delete()
      .eq('id', id);

    if (error) {
      const hint = schemaHint(error.message);
      return NextResponse.json(
        hint ? { error: error.message, hint } : { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
