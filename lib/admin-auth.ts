import crypto from 'crypto';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

export const ADMIN_COOKIE_NAME = 'pmw_admin';

function sha256Hex(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function getExpectedAdminCookieValue() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return null;
  return sha256Hex(adminPassword);
}

export function isAdminRequest(cookies: ReadonlyRequestCookies) {
  const expected = getExpectedAdminCookieValue();
  if (!expected) return false;
  const actual = cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!actual) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
  } catch {
    return false;
  }
}

