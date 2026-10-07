import { revalidateTag } from 'next/cache';
import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

/** Called by the API after any CMS change so ISR pages refresh within seconds. */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET ?? '';
  const got = req.headers.get('x-revalidate-secret') ?? '';
  const ok = secret.length > 0 && got.length === secret.length && timingSafeEqual(Buffer.from(got), Buffer.from(secret));
  if (!ok) return NextResponse.json({ ok: false }, { status: 401 });
  revalidateTag('cms');
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
