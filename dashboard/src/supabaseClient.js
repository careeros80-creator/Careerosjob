import { createClient } from '@supabase/supabase-js';

// Config is fully externalized via env vars (Vite exposes VITE_-prefixed vars).
// Set these in dashboard/.env (see dashboard/.env.example):
//   VITE_SUPABASE_URL       = https://<project-ref>.supabase.co
//   VITE_SUPABASE_ANON_KEY  = <anon public key>
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && anonKey);

// Only construct the client when configured, so the app can render a helpful
// setup message instead of throwing when env vars are absent.
export const supabase = isConfigured ? createClient(url, anonKey) : null;
