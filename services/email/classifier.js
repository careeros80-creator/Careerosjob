/**
 * services/email/classifier.js
 *
 * VS2 M5 — deterministic email classifier (rule-based; pluggable for an LLM
 * later). Maps a recruitment email to the email_classification enum:
 *   interview / offer / rejection / question / auto_reply / ignore(=unknown)
 *
 * Order matters: rejection is checked before offer so "we will not be offering
 * you the position" classifies as a rejection, not an offer.
 */
const RULES = [
  { cls: 'rejection', urgent: false, re: /\b(unfortunately|we regret|regret to inform|not (be )?(moving forward|proceeding|selected)|will not be (moving|offering)|decided not to|position (has been )?filled|other candidates|n'?a(vons)? pas (été )?retenue?|ne (retiendrons|donnerons) pas suite|malheureusement|candidature n'?a pas)\b/i },
  { cls: 'offer', urgent: true, re: /\b(pleased to offer|we are offering|happy to offer|job offer|offer of employment|extend an offer|offre d'?emploi|nous vous offrons|heureux de vous offrir|contrat de travail)\b/i },
  { cls: 'interview', urgent: true, re: /\b(interview|entrevue|schedule (a|an)|set up (a|an)|would like to meet|invite you to|invitation à (un|une)|rencontre|disponibilit[ée]s?|book a time|calendly|zoom|google meet|microsoft teams|convocation)\b/i },
  { cls: 'question', urgent: true, re: /\b(could you (please )?(send|provide|share|confirm)|please (send|provide|confirm|fill)|kindly (send|provide)|pourriez-vous|nous aurions besoin|additional information|missing documents?|documents? (requis|manquants)|references?|remplir le formulaire)\b/i },
  { cls: 'auto_reply', urgent: false, re: /\b(out of office|automatic reply|auto-?reply|do not reply|no-?reply|absence du bureau|réponse automatique|ne pas répondre|message automatique|this is an automated)\b/i },
];

function classify(email = {}) {
  const text = `${email.subject || ''}\n${email.body_text || ''}`;
  const from = (email.from_address || '').toLowerCase();

  for (const r of RULES) {
    if (r.re.test(text)) {
      return { classification: r.cls, confidence: 0.8, is_urgent: r.urgent };
    }
  }
  if (/no-?reply|noreply|donotreply|mailer-daemon/.test(from)) {
    return { classification: 'auto_reply', confidence: 0.7, is_urgent: false };
  }
  return { classification: 'ignore', confidence: 0.4, is_urgent: false }; // unknown
}

/** Timeline event type for a classification. */
function eventType(cls) {
  return {
    interview: 'interview_detected',
    offer: 'offer',
    rejection: 'rejection',
    question: 'info_requested',
    auto_reply: 'email_received',
    ignore: 'email_received',
  }[cls] || 'email_received';
}

module.exports = { classify, eventType, RULES };
