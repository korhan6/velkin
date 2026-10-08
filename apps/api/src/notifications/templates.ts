/** Auto-reply copy per locale. Add a locale by adding an entry; unknown locales fall back to English. */
type Copy = { subject: (ref: string) => string; hello: (name: string) => string; body: string; ref: string; call: string; sign: string };

const COPY: Record<string, Copy> = {
  en: {
    subject: (r) => `We received your request · ${r}`,
    hello: (n) => `Hi ${n},`,
    body: 'Thanks for contacting Velkine. An engineer is reviewing your project and will reply within one business day.',
    ref: 'Reference',
    call: 'Requested call',
    sign: '— Velkine · Motion Engineered',
  },
  es: {
    subject: (r) => `Recibimos tu solicitud · ${r}`,
    hello: (n) => `Hola ${n},`,
    body: 'Gracias por contactar a Velkine. Un ingeniero está revisando tu proyecto y te responderá en un día hábil.',
    ref: 'Referencia',
    call: 'Llamada solicitada',
    sign: '— Velkine · Motion Engineered',
  },
  pt: {
    subject: (r) => `Recebemos sua solicitação · ${r}`,
    hello: (n) => `Olá ${n},`,
    body: 'Obrigado por contatar a Velkine. Um engenheiro está analisando seu projeto e responderá em até um dia útil.',
    ref: 'Referência',
    call: 'Chamada solicitada',
    sign: '— Velkine · Motion Engineered',
  },
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function autoReply(opts: { locale: string; name: string; reference: string; timezone: string; preferredCallAt?: Date | null }) {
  const c = COPY[opts.locale.split('-')[0]] ?? COPY.en;
  const call = opts.preferredCallAt
    ? new Intl.DateTimeFormat(opts.locale, { dateStyle: 'full', timeStyle: 'short', timeZone: opts.timezone }).format(opts.preferredCallAt)
    : null;
  const text = [c.hello(opts.name), '', c.body, '', `${c.ref}: ${opts.reference}`, call ? `${c.call}: ${call} (${opts.timezone})` : '', '', c.sign]
    .filter((l) => l !== null)
    .join('\n');
  const html = `<!doctype html><html><body style="margin:0;background:#0A0A0A;color:#EDEAE3;font-family:Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;border:1px solid #2E2E2C;border-radius:12px">
<tr><td style="padding:32px">
<p style="margin:0 0 24px;font-family:monospace;font-size:12px;letter-spacing:3px;color:#FF5A1F">VELKINE · MOTION ENGINEERED</p>
<p style="margin:0 0 16px;font-size:18px">${esc(c.hello(opts.name))}</p>
<p style="margin:0 0 24px;line-height:1.6;color:#BDBDBA">${esc(c.body)}</p>
<p style="margin:0;font-family:monospace;font-size:13px">${esc(c.ref)}: <strong>${esc(opts.reference)}</strong></p>
${call ? `<p style="margin:8px 0 0;font-family:monospace;font-size:13px">${esc(c.call)}: ${esc(call)} (${esc(opts.timezone)})</p>` : ''}
</td></tr></table></td></tr></table></body></html>`;
  return { subject: c.subject(opts.reference), text, html };
}
