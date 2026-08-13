/**
 * services/email/parser.js
 *
 * VS2 M5 — extract structured metadata from a recruitment email:
 * meeting date/time/timezone/location/url, reply deadline, attachments.
 * Deterministic; understands a few common EN/FR date formats.
 */
const pad = (n) => String(n).padStart(2, '0');
const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8,
  september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, aout: 8,
  septembre: 9, octobre: 10, novembre: 11, decembre: 12,
};
const deacc = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function parseDate(s) {
  let m;
  if ((m = s.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/))) return `${m[1]}-${m[2]}-${m[3]}`;
  if ((m = s.match(/\b([A-Za-zûéôàèçâ]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})\b/))) {
    const mo = MONTHS[deacc(m[1])]; if (mo) return `${m[3]}-${pad(mo)}-${pad(+m[2])}`;
  }
  if ((m = s.match(/\b(\d{1,2})(?:er)?\s+([A-Za-zûéôàèçâ]+)\.?\s+(20\d{2})\b/))) {
    const mo = MONTHS[deacc(m[2])]; if (mo) return `${m[3]}-${pad(mo)}-${pad(+m[1])}`;
  }
  return null;
}

function parseTime(s) {
  const m = s.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)\b|\b([01]?\d|2[0-3]):([0-5]\d)\b/i);
  if (!m) return null;
  if (m[4] != null) return `${pad(+m[4])}:${m[5]}`;            // 24h "14:00"
  let h = +m[1]; const min = m[2] ? +m[2] : 0;
  const ap = (m[3] || '').toLowerCase();
  if (ap.startsWith('p') && h < 12) h += 12;
  if (ap.startsWith('a') && h === 12) h = 0;
  return `${pad(h)}:${pad(min)}`;
}

function parseTimezone(s) {
  const m = s.match(/\b(EST|EDT|ET|PST|PDT|PT|AST|ADT|CST|CDT|MST|MDT|UTC|GMT)\b|\b(America\/[A-Za-z_]+)\b|\b(Eastern|Atlantic|Pacific|Central|Mountain)\b/);
  return m ? (m[1] || m[2] || m[3]) : null;
}

function parseUrl(s) {
  const m = s.match(/https?:\/\/[^\s)>"']*(?:zoom\.us|meet\.google\.com|teams\.microsoft\.com|calendly\.com)[^\s)>"']*/i);
  return m ? m[0].replace(/[.,;:!?]+$/, '') : null; // trim trailing sentence punctuation
}

function parseLocation(s, hasUrl) {
  // Explicit location keywords only (avoid loose matches like "au" inside "August").
  const m = s.match(/\b(?:location|adresse|address|in[- ]?person at|à l'adresse)\s*[:\-]?\s*([^\n.;]{4,80})/i);
  if (m) return m[1].trim();
  return hasUrl ? 'Online' : null;
}

function parseReplyDeadline(s) {
  const m = s.match(/\b(?:reply|respond|confirm|répondre|confirmer|rsvp|let us know)\b[^.\n]{0,40}?\b(?:by|before|avant le?|d'?ici)\s+([^.\n;]{4,40})/i);
  if (m) { const d = parseDate(m[1]); if (d) return d; }
  return null;
}

/** Full metadata for one email (attachments passed through from the message). */
function parseEmail(email = {}) {
  const text = `${email.subject || ''}\n${email.body_text || ''}`;
  const url = parseUrl(text);
  const date = parseDate(text);
  const time = parseTime(text);
  const tz = parseTimezone(text);
  // Only treat a date as a MEETING when there's a meeting signal (a time, a
  // meeting URL, or a meeting keyword) — otherwise a "reply by <date>" deadline
  // would be misread as a meeting.
  const hasMeetingSignal = Boolean(time) || Boolean(url) ||
    /\b(interview|entrevue|meet(ing)?|rencontre|call|zoom|teams|google meet|invit)\b/i.test(text);
  const meeting_at = (date && hasMeetingSignal) ? `${date}T${time || '00:00'}:00` : null;

  return {
    from_address: email.from_address || null,
    subject: email.subject || null,
    received_at: email.received_at || null,
    meeting_at,
    meeting_timezone: meeting_at ? tz : null,
    meeting_location: meeting_at ? parseLocation(text, !!url) : null,
    meeting_url: url,
    reply_deadline: parseReplyDeadline(text),
    attachments: Array.isArray(email.attachments) ? email.attachments : [],
  };
}

module.exports = { parseEmail, parseDate, parseTime, parseTimezone, parseUrl };
