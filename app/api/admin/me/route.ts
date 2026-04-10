import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isAdminRequest } from '@/lib/admin-auth';

export async function GET() {
  return NextResponse.json({ isAdmin: isAdminRequest(await cookies()) });
}

