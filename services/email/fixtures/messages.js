/**
 * services/email/fixtures/messages.js
 *
 * TEST DATA — representative recruitment emails (no live inbox in this
 * environment). Used by tests and the runtime demo. Not production data.
 */
const MESSAGES = [
  {
    gmail_message_id: 'MSG_INT_1', gmail_thread_id: 'T-nordik',
    from_address: 'recruiter@nordikspavillage.ca', subject: 'Interview invitation — Esthetician',
    received_at: '2026-08-14T13:05:00Z',
    body_text: 'Hello, we would like to invite you to an interview on August 20, 2026 at 2:00 PM EDT. ' +
      'Please join via Zoom: https://zoom.us/j/123456789. Kindly confirm by August 18, 2026.',
    attachments: [],
  },
  {
    gmail_message_id: 'MSG_OFFER_1', gmail_thread_id: 'T-nordik',
    from_address: 'hr@nordikspavillage.ca', subject: 'Job offer — Esthetician position',
    received_at: '2026-08-22T09:00:00Z',
    body_text: 'We are pleased to offer you the position of Esthetician. The offer letter is attached.',
    attachments: [{ filename: 'offer_letter.pdf', mime_type: 'application/pdf', size: 84213 }],
  },
  {
    gmail_message_id: 'MSG_REJ_1', gmail_thread_id: 'T-salon',
    from_address: 'recruiter@salonelegance.ca', subject: 'Your application — Hairstylist',
    received_at: '2026-08-15T16:20:00Z',
    body_text: 'Thank you for applying. Unfortunately, we will not be moving forward with your application. We wish you success.',
    attachments: [],
  },
  {
    gmail_message_id: 'MSG_INFO_1', gmail_thread_id: 'T-nordik',
    from_address: 'hr@nordikspavillage.ca', subject: 'Additional documents needed',
    received_at: '2026-08-16T11:00:00Z',
    body_text: 'Could you please send your references and a copy of your certification? Reply by August 19, 2026.',
    attachments: [],
  },
  {
    gmail_message_id: 'MSG_AUTO_1', gmail_thread_id: 'T-portal',
    from_address: 'noreply@jobs-portal.ca', subject: 'Automatic reply: application received',
    received_at: '2026-08-14T13:06:00Z',
    body_text: 'This is an automated confirmation. Please do not reply to this message.',
    attachments: [],
  },
  {
    gmail_message_id: 'MSG_UNK_1', gmail_thread_id: 'T-misc',
    from_address: 'friend@example.org', subject: 'Coffee?',
    received_at: '2026-08-14T18:00:00Z',
    body_text: 'Hey, want to grab a coffee sometime next week?',
    attachments: [],
  },
];

// Sample applications the emails link to (Test Data — represent packages a human
// approved + sent; nothing here was auto-sent).
const APPLICATIONS = [
  { id: 'app-nordik', job_id: 'job-nordik', company_id: 'co-nordik', gmail_thread_id: 'T-nordik', company_name: 'Nordik Spa Village', job_title: 'Esthetician' },
  { id: 'app-salon', job_id: 'job-salon', company_id: 'co-salon', gmail_thread_id: 'T-salon', company_name: 'Salon Élégance', job_title: 'Hairstylist' },
];

module.exports = { MESSAGES, APPLICATIONS };
