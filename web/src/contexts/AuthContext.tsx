/**
 * Auth context for Gracestack AI Lab.
 *
 * When auth is NOT enabled (no Supabase env vars), the app renders
 * children directly — zero impact on existing behavior.
 *
 * When auth IS enabled, wraps the app with login/register flow.
 */
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { getSupabase, isAuthEnabled, loadAuthConfig } from "../lib/supabase";
import { BRIDGE_URL } from "../config";
import type { User, Session } from "@supabase/supabase-js";

type UserRole = "admin" | "user" | "viewer";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authEnabled: boolean;
  role: UserRole;
  isAdmin: boolean;
  isViewer: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  authEnabled: false,
  role: "user",
  isAdmin: false,
  isViewer: false,
  login: async () => "Not initialized",
  register: async () => "Not initialized",
  logout: async () => {},
  getAccessToken: () => null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>("user");
  const [authReady, setAuthReady] = useState(isAuthEnabled);

  // On mount: load auth config from backend, then check session
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    loadAuthConfig().then(() => {
      setAuthReady(isAuthEnabled);

      if (!isAuthEnabled) {
        setLoading(false);
        return;
      }

      const supabase = getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }

      // Get initial session
      supabase.auth.getSession().then(async ({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.access_token) {
          await fetchRole(s.access_token);
        }
        setLoading(false);
      });

      // Listen for auth changes
      const { data } = supabase.auth.onAuthStateChange(
        async (_event, s) => {
          setSession(s);
          setUser(s?.user ?? null);
          if (s?.access_token) {
            await fetchRole(s.access_token);
          } else {
            setRole("user");
          }
        },
      );
      subscription = data.subscription;
    });

    return () => { subscription?.unsubscribe(); };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const supabase = getSupabase();
    if (!supabase) return "Auth not configured";

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<string | null> => {
    const supabase = getSupabase();
    if (!supabase) return "Auth not configured";

    const { error } = await supabase.auth.signUp({ email, password });
    return error ? error.message : null;
  }, []);

  const fetchRole = useCallback(async (token: string) => {
    try {
      const res = await fetch(
        `${BRIDGE_URL}/api/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const data = await res.json();
        setRole((data.user?.role || "user") as UserRole);
      }
    } catch { /* keep default */ }
  }, []);

  const logout = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole("user");
  }, []);

  const getAccessToken = useCallback((): string | null => {
    return session?.access_token ?? null;
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        authEnabled: authReady,
        role,
        isAdmin: role === "admin",
        isViewer: role === "viewer",
        login,
        register,
        logout,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
