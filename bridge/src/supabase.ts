/**
 * Supabase client for Gracestack AI Lab.
 *
 * This module is opt-in: if SUPABASE_URL is not set, all helpers
 * return null / no-op so the rest of the bridge keeps working
 * exactly as before.
 */
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Feature flag — everything is disabled when env vars are missing
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const isSupabaseEnabled = (): boolean =>
  !!(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_KEY);

// ---------------------------------------------------------------------------
// Clients (lazy-created, only when enabled)
// ---------------------------------------------------------------------------

/** Public client — used in frontend-facing contexts (respects RLS). */
let _anon: SupabaseClient | null = null;
export function getAnonClient(): SupabaseClient | null {
  if (!isSupabaseEnabled()) return null;
  if (!_anon) {
    _anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _anon;
}

/** Service-role client — bypasses RLS. Use only on the server for admin ops. */
let _service: SupabaseClient | null = null;
export function getServiceClient(): SupabaseClient | null {
  if (!isSupabaseEnabled()) return null;
  if (!_service) {
    _service = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _service;
}

// ---------------------------------------------------------------------------
// Auth helpers (server-side)
// ---------------------------------------------------------------------------

export interface AuthResult {
  user: User | null;
  error: string | null;
  session?: { access_token: string; refresh_token: string };
}

/** Register a new user with email + password. */
export async function registerUser(
  email: string,
  password: string,
): Promise<AuthResult> {
  const client = getServiceClient();
  if (!client) return { user: null, error: "Supabase not configured" };

  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // auto-confirm for now
  });

  if (error) return { user: null, error: error.message };

  // Create a profile row
  if (data.user) {
    await client.from("profiles").upsert({
      id: data.user.id,
      email: data.user.email,
      role: "user",
      created_at: new Date().toISOString(),
    });
  }

  // Sign in to get tokens
  const anon = getAnonClient();
  if (!anon) return { user: data.user, error: null };

  const { data: signIn, error: signErr } = await anon.auth.signInWithPassword({
    email,
    password,
  });

  if (signErr) return { user: data.user, error: null }; // user created but login failed

  return {
    user: signIn.user,
    error: null,
    session: signIn.session
      ? {
          access_token: signIn.session.access_token,
          refresh_token: signIn.session.refresh_token,
        }
      : undefined,
  };
}

/** Sign in an existing user. */
export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResult> {
  const anon = getAnonClient();
  if (!anon) return { user: null, error: "Supabase not configured" };

  const { data, error } = await anon.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { user: null, error: error.message };

  return {
    user: data.user,
    error: null,
    session: data.session
      ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }
      : undefined,
  };
}

/** Verify a JWT access token and return the user. */
export async function verifyToken(token: string): Promise<User | null> {
  const client = getServiceClient();
  if (!client) return null;

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

/** Get user profile (role, etc.) */
export async function getUserProfile(
  userId: string,
): Promise<{ role: string; email: string } | null> {
  const client = getServiceClient();
  if (!client) return null;

  const { data, error } = await client
    .from("profiles")
    .select("role, email")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as { role: string; email: string };
}

// ---------------------------------------------------------------------------
// Admin helpers
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

/** List all user profiles (admin only). */
export async function listUsers(): Promise<UserProfile[]> {
  const client = getServiceClient();
  if (!client) return [];

  const { data, error } = await client
    .from("profiles")
    .select("id, email, role, display_name, created_at, updated_at")
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data || []) as UserProfile[];
}

/** Update a user's role (admin only). */
export async function updateUserRole(
  userId: string,
  role: "admin" | "user" | "viewer",
): Promise<{ ok: boolean; error?: string }> {
  const client = getServiceClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await client
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Delete a user and their data (admin only). */
export async function deleteUser(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = getServiceClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  // Delete auth user (cascades to profiles via FK)
  const { error } = await client.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Get total user count. */
export async function getUserCount(): Promise<number> {
  const client = getServiceClient();
  if (!client) return 0;

  const { count, error } = await client
    .from("profiles")
    .select("id", { count: "exact", head: true });

  if (error) return 0;
  return count || 0;
}

console.log(
  isSupabaseEnabled()
    ? "[supabase] ✅ Supabase enabled"
    : "[supabase] ⏭️  Supabase not configured — running without auth (single-user mode)",
);
