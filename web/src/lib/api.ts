/**
 * Authenticated fetch wrapper for Gracestack AI Lab.
 *
 * Automatically attaches Supabase JWT token to all requests
 * when auth is enabled. Falls through to normal fetch otherwise.
 */
import { getSupabase, isAuthEnabled } from "./supabase";

export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  if (!isAuthEnabled) return fetch(input, init);

  const supabase = getSupabase();
  if (!supabase) return fetch(input, init);

  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  if (!token) return fetch(input, init);

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(input, { ...init, headers });
}
