/**
 * Auth context for Gracestack AI Lab.
 *
 * When auth is NOT enabled (no Supabase env vars), the app renders
 * children directly — zero impact on existing behavior.
 *
 * When auth IS enabled, wraps the app with login/register flow.
 */
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { getSupabase, isAuthEnabled } from "../lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authEnabled: boolean;
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

  // On mount: check for existing session
  useEffect(() => {
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
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
      },
    );

    return () => subscription.unsubscribe();
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

  const logout = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setSession(null);
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
        authEnabled: isAuthEnabled,
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
