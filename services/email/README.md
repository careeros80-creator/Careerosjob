# Email Intelligence (VS2 — Module 5)

Classifies inbound recruitment email, extracts metadata, links each message to
an application, and builds a per-application timeline. **READ-ONLY** — it never
replies, sends, or accepts (ADR-006).

## Auth
`GmailProvider` uses **OAuth 2.0 only** — client id/secret + refresh token via
Supabase Vault references (`secret_refs`). The user's **password is never
requested or stored**. No live inbox in this environment → messages are injected
fixtures (**Test Data**); the provider refuses to fabricate data otherwise.

## Classifier (deterministic; pluggable for an LLM)
`interview / offer / rejection / question(information request) / auto_reply /
ignore(unknown)`. Rejection is checked before offer so "will not be offering"
→ rejection.

## Parser
Extracts sender, subject, received date, **meeting date/time/timezone/location/
URL** (Zoom/Meet/Teams/Calendly), reply deadline, attachments. A date is only a
meeting when there's a meeting signal (time / URL / keyword) — a "reply by
<date>" deadline is not mistaken for a meeting.

## Linking + timeline
Each email links to an application by `gmail_thread_id → company → job title`.
Linked emails create `application_timeline` events
(`interview_detected / offer / rejection / info_requested / email_received`).

## Persistence (migration 017)
- `emails` — classification, confidence, urgency, requires_action, meeting_*,
  reply_deadline, attachments JSONB. Idempotent (`UNIQUE gmail_message_id`).
- `application_timeline` — idempotent per `(email_id, event_type)`.
- `email_dashboard` view — unread_actions, interviews, offers, rejected,
  info_requests, auto_replies, unknown, waiting.

## Guardrails
No auto-reply, no auto-submit, no auto-accept. Every outbound email requires
explicit user approval; this module only reads and records.

## Tests
`tests/email/` — classifier 11, parser 14, attachments 6, threading 6;
`tests/integration/test_email.js` 15.
