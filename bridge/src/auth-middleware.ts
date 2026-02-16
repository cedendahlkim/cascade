/**
 * Auth middleware for Gracestack AI Lab.
 *
 * Opt-in: when Supabase is NOT configured, all requests pass through
 * unchanged (single-user mode, exactly like before).
 *
 * When Supabase IS configured, requests to protected routes must
 * include a valid `Authorization: Bearer <token>` header.
 */
import type { Request, Response, NextFunction } from "express";
import { isSupabaseEnabled, verifyToken, getUserProfile } from "./supabase.js";

// Extend Express Request to carry authenticated user info
declare global {
  namespace Express {
    interface Request {
      /** Set by auth middleware when Supabase is enabled */
      userId?: string;
      userEmail?: string;
      userRole?: string;
    }
  }
}

// Routes that never require auth (even when Supabase is enabled)
const PUBLIC_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/me",
  "/api/auth/enabled",
  "/api/status",
  "/api/tunnel",
  "/api/qr",
];

// Routes that STRICTLY require a valid token (401 if missing/invalid)
const PROTECTED_ROUTES = [
  "/api/auth/me",
];

/**
 * Express middleware that verifies Supabase JWT tokens.
 *
 * Strategy: "soft auth" — always passes through, but attaches user info
 * if a valid token is present. Only routes in PROTECTED_ROUTES will 401.
 * This lets the app work immediately after login while still providing
 * user context for future per-user data isolation.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Single-user mode: no auth required
  if (!isSupabaseEnabled()) {
    return next();
  }

  // Static files (HTML, JS, CSS, images) always pass immediately
  if (
    !req.path.startsWith("/api/") &&
    !req.path.startsWith("/socket.io/") &&
    !req.path.startsWith("/cascade/")
  ) {
    return next();
  }

  // Extract Bearer token (if present)
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const isProtected = PROTECTED_ROUTES.some(
    (r) => req.path === r || req.path.startsWith(r + "/"),
  );

  // No token
  if (!token) {
    if (isProtected) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    return next();
  }

  // Verify token async, attach user info
  verifyToken(token)
    .then(async (user) => {
      if (!user) {
        if (isProtected) {
          res.status(401).json({ error: "Invalid or expired token" });
          return;
        }
        return next();
      }

      // Attach user info to request
      req.userId = user.id;
      req.userEmail = user.email;

      // Get role from profiles table
      const profile = await getUserProfile(user.id);
      req.userRole = profile?.role || "user";

      next();
    })
    .catch(() => {
      if (isProtected) {
        res.status(401).json({ error: "Token verification failed" });
        return;
      }
      next();
    });
}

/**
 * Verify a Socket.IO connection token.
 * Returns userId or null if invalid / Supabase not configured.
 */
export async function verifySocketToken(token: string | undefined): Promise<string | null> {
  if (!isSupabaseEnabled()) return "single-user"; // no auth needed
  if (!token) return null;

  const user = await verifyToken(token);
  return user?.id || null;
}

// ---------------------------------------------------------------------------
// Role-based access guards
// ---------------------------------------------------------------------------

type Role = "admin" | "user" | "viewer";

/**
 * Require a valid authenticated user. Returns 401 if not logged in.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!isSupabaseEnabled()) return next(); // single-user mode
  if (!req.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

/**
 * Require one of the specified roles. Returns 403 if insufficient.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!isSupabaseEnabled()) return next(); // single-user mode
    if (!req.userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const userRole = (req.userRole || "user") as Role;
    if (!roles.includes(userRole)) {
      res.status(403).json({ error: `Requires role: ${roles.join(" or ")}` });
      return;
    }
    next();
  };
}

/**
 * Shorthand: require admin role.
 */
export const requireAdmin = requireRole("admin");
