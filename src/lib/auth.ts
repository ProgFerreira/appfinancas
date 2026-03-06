import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'session';
const SECRET = process.env.APP_SECRET ?? 'default-secret-change-me';

function sign(value: string): string {
  return createHmac('sha256', SECRET).update(value).digest('hex');
}

export function createSession(userId: number): string {
  const payload = `${userId}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySession(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = sign(payload);
  try {
    if (timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) {
      const id = parseInt(payload, 10);
      return Number.isInteger(id) ? id : null;
    }
  } catch {
    return null;
  }
  return null;
}

export async function getSessionUserId(): Promise<number | null> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySession(token);
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: number) {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSession(userId), {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function clearSessionCookie() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
