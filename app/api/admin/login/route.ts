import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, getExpectedAdminCookieValue } from '@/lib/admin-auth';

export async function POST(request: Request) {
  const expectedCookie = getExpectedAdminCookieValue();
  if (!expectedCookie) {
    return NextResponse.json(
      { error: 'ADMIN_PASSWORD_NOT_SET' },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { password?: string }
    | null;

  const password = body?.password?.trim() ?? '';
  if (!password) {
    return NextResponse.json({ error: 'MISSING_PASSWORD' }, { status: 400 });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'INVALID_PASSWORD' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: expectedCookie,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
