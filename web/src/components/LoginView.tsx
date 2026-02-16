/**
 * Login / Register view for Gracestack AI Lab.
 *
 * Only shown when Supabase auth is enabled AND user is not logged in.
 * Matches the app's dark glass aesthetic.
 */
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LogIn, UserPlus, Loader2, AlertCircle } from "lucide-react";

export default function LoginView() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Fyll i e-post och lösenord");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      setError("Lösenorden matchar inte");
      return;
    }

    if (password.length < 6) {
      setError("Lösenordet måste vara minst 6 tecken");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const err = await login(email, password);
        if (err) setError(err);
      } else {
        const err = await register(email, password);
        if (err) {
          setError(err);
        } else {
          setSuccess("Konto skapat! Du loggas in...");
        }
      }
    } catch (err) {
      setError("Något gick fel. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Gracestack
          </h1>
          <p className="text-sm text-slate-400 mt-1">AI Lab</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-slate-900/50 rounded-xl p-1">
            <button
              onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                mode === "login"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LogIn className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Logga in
            </button>
            <button
              onClick={() => { setMode("register"); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                mode === "register"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Skapa konto
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">E-post</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@email.se"
                autoComplete="email"
                className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Lösenord</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minst 6 tecken"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Bekräfta lösenord</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Skriv lösenordet igen"
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-2.5 bg-red-950/40 border border-red-800/40 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-xs text-red-300">{error}</span>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="p-2.5 bg-green-950/40 border border-green-800/40 rounded-xl">
                <span className="text-xs text-green-300">{success}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin inline" />
              ) : mode === "login" ? (
                "Logga in"
              ) : (
                "Skapa konto"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-4">
          Gracestack AI Lab av Gracestack AB
        </p>
      </div>
    </div>
  );
}
