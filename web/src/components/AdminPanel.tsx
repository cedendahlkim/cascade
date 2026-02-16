/**
 * Admin Panel — User management, roles, and workspace sharing.
 * Only visible to users with role "admin".
 */
import { useState, useEffect, useCallback } from "react";
import { Users, Shield, Trash2, RefreshCw, Crown, Eye, UserCheck, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { BRIDGE_URL } from "../config";

interface UserProfile {
  id: string;
  email: string;
  role: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Crown; color: string; bg: string }> = {
  admin: { label: "Admin", icon: Crown, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
  user: { label: "Användare", icon: UserCheck, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
  viewer: { label: "Betraktare", icon: Eye, color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/30" },
};

export default function AdminPanel() {
  const { getAccessToken, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const headers = useCallback(() => {
    const token = getAccessToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, [getAccessToken]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/admin/users`, { headers: headers() });
      if (!res.ok) throw new Error("Kunde inte hämta användare");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const changeRole = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    setError(null);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Kunde inte ändra roll");
      }
      await fetchUsers();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUserAction = async (userId: string, email: string) => {
    if (!confirm(`Är du säker på att du vill ta bort ${email}? All data raderas permanent.`)) return;
    setActionLoading(userId);
    setError(null);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Kunde inte ta bort användare");
      }
      await fetchUsers();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString("sv-SE"); } catch { return iso; }
  };

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-white">Användarhantering</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400">
            {users.length} användare
          </span>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          title="Uppdatera användarlista"
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-red-950/40 border border-red-800/40 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-xs text-red-300">{error}</span>
        </div>
      )}

      {/* Role legend */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] ${cfg.bg}`}>
              <Icon className={`w-3 h-3 ${cfg.color}`} />
              <span className={cfg.color}>{cfg.label}</span>
            </div>
          );
        })}
      </div>

      {/* User list */}
      {loading ? (
        <div className="text-sm text-slate-500 text-center py-8">Laddar användare...</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const cfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.user;
            const Icon = cfg.icon;
            const isSelf = u.id === currentUser?.id;
            const isLoading = actionLoading === u.id;

            return (
              <div
                key={u.id}
                className={`p-3 rounded-xl border transition-colors ${
                  isSelf
                    ? "bg-indigo-950/30 border-indigo-700/40"
                    : "bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  {/* User info */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1.5 rounded-lg ${cfg.bg} border`}>
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-white truncate">
                          {u.display_name || u.email}
                        </span>
                        {isSelf && (
                          <span className="text-[9px] px-1 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded text-indigo-300">
                            du
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {u.email} · Sedan {formatDate(u.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Role selector */}
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      disabled={isSelf || isLoading}
                      aria-label={`Roll för ${u.email}`}
                      className="text-[11px] bg-slate-900/60 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <option value="admin">Admin</option>
                      <option value="user">Användare</option>
                      <option value="viewer">Betraktare</option>
                    </select>

                    {/* Delete */}
                    {!isSelf && (
                      <button
                        onClick={() => deleteUserAction(u.id, u.email)}
                        disabled={isLoading}
                        className="p-1.5 rounded-lg hover:bg-red-950/40 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-40"
                        title="Ta bort användare"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Permissions info */}
      <div className="p-3 bg-slate-800/30 border border-slate-700/30 rounded-xl">
        <div className="flex items-center gap-1.5 mb-2">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-300">Rollbehörigheter</span>
        </div>
        <div className="space-y-1.5 text-[10px] text-slate-400">
          <div><span className="text-amber-400 font-medium">Admin</span> — Full åtkomst. Hantera användare, roller, alla konversationer.</div>
          <div><span className="text-blue-400 font-medium">Användare</span> — Chatta med AI, skapa konversationer, dela workspace.</div>
          <div><span className="text-slate-300 font-medium">Betraktare</span> — Läs delade konversationer. Kan inte skicka meddelanden.</div>
        </div>
      </div>
    </div>
  );
}
