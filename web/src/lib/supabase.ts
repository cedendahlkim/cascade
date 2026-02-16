/**
 * Supabase client for Gracestack AI Lab frontend.
 *
 * Reads SUPABASE_URL and SUPABASE_ANON_KEY from Vite env vars.
 * If not set, returns null — the app runs in single-user mode.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isAuthEnabled = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isAuthEnabled) return null;
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}
