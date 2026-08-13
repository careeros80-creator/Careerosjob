/**
 * services/email/EmailIntelligenceService.js
 *
 * VS2 M5 — classify inbound emails, extract metadata, link each to an existing
 * application, and produce timeline events. READ-ONLY: never replies, never
 * sends, never accepts (ADR-006). Idempotent by gmail_message_id.
 */
const { classify, eventType } = require('./classifier');
const { parseEmail } = require('./parser');

class EmailIntelligenceService {
  constructor({ now = () => new Date().toISOString() } = {}) {
    this.now = now;
    this.metrics = { processed: 0, linked: 0, by_class: {} };
  }

  /** Link an email to an application: thread id → company → job title. */
  linkApplication(message, applications = []) {
    if (message.gmail_thread_id) {
      const byThread = applications.find(a => a.gmail_thread_id && a.gmail_thread_id === message.gmail_thread_id);
      if (byThread) return byThread;
    }
    const hay = `${message.from_address || ''} ${message.subject || ''} ${message.body_text || ''}`.toLowerCase();
    const byCompany = applications.find(a => a.company_name && hay.includes(a.company_name.toLowerCase()));
    if (byCompany) return byCompany;
    const byJob = applications.find(a => a.job_title && hay.includes(a.job_title.toLowerCase()));
    return byJob || null;
  }

  process(messages = [], { applications = [] } = {}) {
    const emails = [];
    const timeline = [];
    const seen = new Set();

    for (const msg of messages) {
      if (!msg.gmail_message_id || seen.has(msg.gmail_message_id)) continue;
      seen.add(msg.gmail_message_id);

      const cls = classify(msg);
      const meta = parseEmail(msg);
      const app = this.linkApplication(msg, applications);
      const requires_action = ['interview', 'offer', 'question'].includes(cls.classification);

      emails.push({
        gmail_message_id: msg.gmail_message_id,
        gmail_thread_id: msg.gmail_thread_id || null,
        application_id: app ? app.id : null,
        job_id: app ? app.job_id || null : null,
        company_id: app ? app.company_id || null : null,
        from_address: meta.from_address,
        subject: meta.subject,
        body_text: msg.body_text || null,
        received_at: meta.received_at,
        classification: cls.classification,
        confidence: cls.confidence,
        is_urgent: cls.is_urgent,
        requires_action,
        reply_deadline: meta.reply_deadline,
        meeting_at: meta.meeting_at,
        meeting_timezone: meta.meeting_timezone,
        meeting_location: meta.meeting_location,
        meeting_url: meta.meeting_url,
        attachments: meta.attachments,
      });

      this.metrics.processed += 1;
      this.metrics.by_class[cls.classification] = (this.metrics.by_class[cls.classification] || 0) + 1;

      if (app) {
        this.metrics.linked += 1;
        timeline.push({
          application_id: app.id,
          job_id: app.job_id || null,
          gmail_message_id: msg.gmail_message_id,
          event_type: eventType(cls.classification),
          event_at: meta.received_at || this.now(),
          detail: {
            classification: cls.classification, subject: meta.subject,
            meeting_at: meta.meeting_at, meeting_url: meta.meeting_url,
            reply_deadline: meta.reply_deadline,
          },
        });
      }
    }
    return { emails, timeline, metrics: this.metrics };
  }
}

module.exports = { EmailIntelligenceService };
