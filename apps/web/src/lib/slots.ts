/** Time-zone math without dependencies (Intl only). All instants are handled in UTC. */
export function tzOffsetMs(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return asUtc - date.getTime();
}

/** Converts a wall-clock time in `tz` into a UTC Date. */
export function wallToUtc(y: number, m: number, d: number, h: number, tz: string) {
  const guess = Date.UTC(y, m, d, h);
  const first = guess - tzOffsetMs(new Date(guess), tz);
  // second pass handles DST transitions
  return new Date(guess - tzOffsetMs(new Date(first), tz));
}

/** Next business-day intro-call slots in the company's time zone, returned as UTC instants. */
export function upcomingSlots({
  companyTz,
  days = 6,
  hours = [9, 10, 11, 14, 15, 16],
  leadHours = 18,
  now = new Date(),
}: {
  companyTz: string;
  days?: number;
  hours?: number[];
  leadHours?: number;
  now?: Date;
}): Date[] {
  const local = new Date(now.getTime() + tzOffsetMs(now, companyTz));
  const out: Date[] = [];
  let y = local.getUTCFullYear(), m = local.getUTCMonth(), d = local.getUTCDate();
  let found = 0;
  for (let i = 0; i < 21 && found < days; i++) {
    d += 1;
    const probe = new Date(Date.UTC(y, m, d));
    y = probe.getUTCFullYear();
    m = probe.getUTCMonth();
    d = probe.getUTCDate();
    const dow = probe.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    found++;
    for (const h of hours) {
      const slot = wallToUtc(y, m, d, h, companyTz);
      if (slot.getTime() - now.getTime() > leadHours * 3600_000) out.push(slot);
    }
  }
  return out;
}
