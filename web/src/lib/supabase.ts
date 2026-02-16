/**
 * Supabase client for Gracestack AI Lab frontend.
 *
 * Fetches Supabase config from the backend at runtime via /api/auth/config.
 * Falls back to Vite env vars if available (for local dev).
 * If neither is set, the app runs in single-user mode.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { BRIDGE_URL } from "../config";

let _supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
let _supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
let _client: SupabaseClient | null = null;
let _configLoaded = false;
let _configPromise: Promise<void> | null = null;

/** Whether auth is enabled (may change after loadAuthConfig resolves) */
export let isAuthEnabled = !!(_supabaseUrl && _supabaseAnonKey);

/** Fetch Supabase config from backend (called once on app start) */
export function loadAuthConfig(): Promise<void> {
  if (_configLoaded && isAuthEnabled) return Promise.resolve();
  if (_configPromise) return _configPromise;

  _configPromise = fetch(`${BRIDGE_URL}/api/auth/config`)
    .then((res) => res.json())
    .then((data: { enabled: boolean; supabaseUrl: string; supabaseAnonKey: string }) => {
      if (data.enabled && data.supabaseUrl && data.supabaseAnonKey) {
        _supabaseUrl = data.supabaseUrl;
        _supabaseAnonKey = data.supabaseAnonKey;
        isAuthEnabled = true;
      }
      _configLoaded = true;
    })
    .catch(() => {
      _configLoaded = true;
    });

  return _configPromise;
}

export function getSupabase(): SupabaseClient | null {
  if (!isAuthEnabled) return null;
  if (!_client) {
    _client = createClient(_supabaseUrl, _supabaseAnonKey);
  }
  return _client;
}
