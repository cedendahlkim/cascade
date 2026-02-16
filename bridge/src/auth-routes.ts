/**
 * Auth REST endpoints for Gracestack AI Lab.
 *
 * POST /api/auth/register  — create account
 * POST /api/auth/login     — sign in
 * GET  /api/auth/me        — get current user (requires token)
 * GET  /api/auth/enabled   — check if auth is active
 *
 * These routes are always mounted but return "auth not enabled"
 * when Supabase is not configured, so nothing breaks.
 */
import { Router } from "express";
import {
  isSupabaseEnabled,
  registerUser,
  loginUser,
  verifyToken,
  getUserProfile,
} from "./supabase.js";

const router = Router();

// Check if auth system is enabled
router.get("/api/auth/enabled", (_req, res) => {
  res.json({ enabled: isSupabaseEnabled() });
});

// Register
router.post("/api/auth/register", async (req, res) => {
  if (!isSupabaseEnabled()) {
    res.json({ error: "Auth not enabled — running in single-user mode" });
    return;
  }

  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const result = await registerUser(email, password);
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({
    user: {
      id: result.user?.id,
      email: result.user?.email,
    },
    session: result.session,
  });
});

// Login
router.post("/api/auth/login", async (req, res) => {
  if (!isSupabaseEnabled()) {
    res.json({ error: "Auth not enabled — running in single-user mode" });
    return;
  }

  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  const result = await loginUser(email, password);
  if (result.error) {
    res.status(401).json({ error: result.error });
    return;
  }

  res.json({
    user: {
      id: result.user?.id,
      email: result.user?.email,
    },
    session: result.session,
  });
});

// Get current user info (requires valid token)
router.get("/api/auth/me", async (req, res) => {
  if (!isSupabaseEnabled()) {
    res.json({ user: null, mode: "single-user" });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const token = authHeader.slice(7);
  const user = await verifyToken(token);
  if (!user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const profile = await getUserProfile(user.id);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      role: profile?.role || "user",
    },
  });
});

export default router;
