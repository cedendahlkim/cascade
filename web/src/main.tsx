import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginView from "./components/LoginView";
import "./index.css";

function AuthGate() {
  const { user, loading, authEnabled } = useAuth();

  // Auth not configured → single-user mode, show app directly
  if (!authEnabled) return <App />;

  // Loading auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Laddar...</div>
      </div>
    );
  }

  // Not logged in → show login
  if (!user) return <LoginView />;

  // Logged in → show app
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  </React.StrictMode>
);
