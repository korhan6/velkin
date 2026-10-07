import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { Global, Injectable, Logger, Module } from '@nestjs/common';
import type { Lead } from '@prisma/client';
import { env } from '../config/env';
import { autoReply } from './templates';

type Mail = { to: string; subject: string; text: string; html?: string; replyTo?: string };

@Injectable()
export class NotificationsService {
  private readonly log = new Logger('Notifications');
  private ses?: SESv2Client;

  async send(mail: Mail) {
    const e = env();
    if (e.MAIL_PROVIDER === 'log') {
      this.log.log(`[mail:log] to=${mail.to} subject="${mail.subject}"`);
      return;
    }
    if (e.MAIL_PROVIDER === 'resend') {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${e.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: e.MAIL_FROM, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html, reply_to: mail.replyTo }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
      return;
    }
    this.ses ??= new SESv2Client({ region: e.AWS_REGION });
    await this.ses.send(
      new SendEmailCommand({
        FromEmailAddress: e.MAIL_FROM,
        Destination: { ToAddresses: [mail.to] },
        ReplyToAddresses: mail.replyTo ? [mail.replyTo] : undefined,
        Content: {
          Simple: {
            Subject: { Data: mail.subject, Charset: 'UTF-8' },
            Body: { Text: { Data: mail.text, Charset: 'UTF-8' }, ...(mail.html ? { Html: { Data: mail.html, Charset: 'UTF-8' } } : {}) },
          },
        },
      }),
    );
  }

  async telegram(text: string) {
    const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chat } = env();
    if (!token || !chat) return;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8_000),
    });
  }

  /** Generic webhook (e.g. a WhatsApp Business / Twilio / n8n flow you control). */
  async whatsappWebhook(payload: unknown) {
    const url = env().WHATSAPP_WEBHOOK_URL;
    if (!url) return;
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(8_000) });
  }

  /** Fire-and-forget fan-out after a lead is stored. Never throws. */
  async onNewLead(lead: Lead, attachments: number) {
    const e = env();
    const RANGES: Record<string, string> = { lt25: '< 25k', '25-100': '25k–100k', '100-500': '100k–500k', gt500: '> 500k', unsure: 'not defined' };
    const budget = lead.budgetAmount
      ? `${lead.budgetAmount.toString()} ${lead.budgetCurrency}`
      : lead.budgetRange
        ? `${RANGES[lead.budgetRange] ?? lead.budgetRange} (USD-equiv.), shown in ${lead.budgetCurrency ?? 'USD'}`
        : 'not defined';
    const summary = [
      `New lead ${lead.reference}`,
      `${lead.name}${lead.jobTitle ? ` (${lead.jobTitle})` : ''} <${lead.email}>${lead.company ? ` · ${lead.company}` : ''}`,
      `Country: ${lead.country} (${lead.region}) · IP country: ${lead.ipCountry ?? '?'} · Locale: ${lead.locale} · TZ: ${lead.timezone}`,
      `Type: ${lead.projectType} · Industry: ${lead.industry ?? '-'} · Timeline: ${lead.timeline} · Budget: ${budget}`,
      lead.preferredCallAt ? `Call (UTC): ${lead.preferredCallAt.toISOString()}` : 'Call: no',
      `Files: ${attachments}`,
      '',
      lead.description,
      '',
      `${e.ADMIN_URL}/leads/${lead.id}`,
    ].join('\n');

    const jobs: Promise<unknown>[] = [
      this.send({ to: e.MAIL_TEAM_TO, subject: `[Lead ${lead.region}] ${lead.reference} · ${lead.company ?? lead.name}`, text: summary, replyTo: lead.email }),
      this.telegram(summary.slice(0, 3500)),
      this.whatsappWebhook({ type: 'lead.created', reference: lead.reference, region: lead.region, country: lead.country, name: lead.name }),
    ];
    const reply = autoReply({ locale: lead.locale, name: lead.name.split(' ')[0], reference: lead.reference, timezone: lead.timezone, preferredCallAt: lead.preferredCallAt });
    jobs.push(this.send({ to: lead.email, ...reply }));

    const results = await Promise.allSettled(jobs);
    results.forEach((r) => r.status === 'rejected' && this.log.error(`Notification failed: ${String(r.reason)}`));
  }
}

@Global()
@Module({ providers: [NotificationsService], exports: [NotificationsService] })
export class NotificationsModule {}
