/**
 * Per-user data isolation for Gracestack AI Lab.
 *
 * When Supabase is enabled, conversations and messages are stored
 * per-user in Postgres. When disabled, falls back to the existing
 * flat-file storage (single-user mode).
 */
import { Router } from "express";
import { isSupabaseEnabled, getServiceClient } from "./supabase.js";

const router = Router();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Conversation {
  id: string;
  user_id: string;
  title: string;
  source: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Conversations CRUD
// ---------------------------------------------------------------------------

/** List conversations for the authenticated user */
router.get("/api/user/conversations", async (req, res) => {
  if (!isSupabaseEnabled() || !req.userId) {
    res.json({ conversations: [], mode: "single-user" });
    return;
  }

  const client = getServiceClient();
  if (!client) { res.status(500).json({ error: "DB unavailable" }); return; }

  const { data, error } = await client
    .from("conversations")
    .select("*")
    .eq("user_id", req.userId)
    .order("updated_at", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ conversations: data || [] });
});

/** Create a new conversation */
router.post("/api/user/conversations", async (req, res) => {
  if (!isSupabaseEnabled() || !req.userId) {
    res.status(400).json({ error: "Auth required" });
    return;
  }

  const client = getServiceClient();
  if (!client) { res.status(500).json({ error: "DB unavailable" }); return; }

  const { title, source } = req.body;

  const { data, error } = await client
    .from("conversations")
    .insert({
      user_id: req.userId,
      title: title || "Ny konversation",
      source: source || "claude",
    })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ conversation: data });
});

/** Update conversation title */
router.patch("/api/user/conversations/:id", async (req, res) => {
  if (!isSupabaseEnabled() || !req.userId) {
    res.status(400).json({ error: "Auth required" });
    return;
  }

  const client = getServiceClient();
  if (!client) { res.status(500).json({ error: "DB unavailable" }); return; }

  const { title } = req.body;

  const { data, error } = await client
    .from("conversations")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ conversation: data });
});

/** Delete a conversation (cascades to messages) */
router.delete("/api/user/conversations/:id", async (req, res) => {
  if (!isSupabaseEnabled() || !req.userId) {
    res.status(400).json({ error: "Auth required" });
    return;
  }

  const client = getServiceClient();
  if (!client) { res.status(500).json({ error: "DB unavailable" }); return; }

  const { error } = await client
    .from("conversations")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Messages CRUD
// ---------------------------------------------------------------------------

/** Get messages for a conversation */
router.get("/api/user/conversations/:id/messages", async (req, res) => {
  if (!isSupabaseEnabled() || !req.userId) {
    res.json({ messages: [], mode: "single-user" });
    return;
  }

  const client = getServiceClient();
  if (!client) { res.status(500).json({ error: "DB unavailable" }); return; }

  // Verify ownership or share access
  const { data: conv } = await client
    .from("conversations")
    .select("id, user_id")
    .eq("id", req.params.id)
    .single();

  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  // Check access: owner, shared, or admin
  if (conv.user_id !== req.userId) {
    const { data: share } = await client
      .from("workspace_shares")
      .select("id")
      .eq("conversation_id", req.params.id)
      .eq("shared_with", req.userId)
      .single();

    if (!share && req.userRole !== "admin") {
      res.status(403).json({ error: "Access denied" });
      return;
    }
  }

  const limit = parseInt(req.query.limit as string) || 200;
  const { data, error } = await client
    .from("messages")
    .select("*")
    .eq("conversation_id", req.params.id)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ messages: data || [] });
});

/** Add a message to a conversation */
router.post("/api/user/conversations/:id/messages", async (req, res) => {
  if (!isSupabaseEnabled() || !req.userId) {
    res.status(400).json({ error: "Auth required" });
    return;
  }

  // Viewers cannot send messages
  if (req.userRole === "viewer") {
    res.status(403).json({ error: "Viewers cannot send messages" });
    return;
  }

  const client = getServiceClient();
  if (!client) { res.status(500).json({ error: "DB unavailable" }); return; }

  // Verify ownership or write access
  const { data: conv } = await client
    .from("conversations")
    .select("id, user_id")
    .eq("id", req.params.id)
    .single();

  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  if (conv.user_id !== req.userId) {
    const { data: share } = await client
      .from("workspace_shares")
      .select("permission")
      .eq("conversation_id", req.params.id)
      .eq("shared_with", req.userId)
      .single();

    if (!share || share.permission === "read") {
      res.status(403).json({ error: "Write access required" });
      return;
    }
  }

  const { role, content, metadata } = req.body;

  const { data, error } = await client
    .from("messages")
    .insert({
      conversation_id: req.params.id,
      role: role || "user",
      content: content || "",
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }

  // Update conversation timestamp
  await client
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", req.params.id);

  res.json({ message: data });
});

// ---------------------------------------------------------------------------
// Workspace sharing
// ---------------------------------------------------------------------------

/** Share a conversation with another user */
router.post("/api/user/conversations/:id/share", async (req, res) => {
  if (!isSupabaseEnabled() || !req.userId) {
    res.status(400).json({ error: "Auth required" });
    return;
  }

  const client = getServiceClient();
  if (!client) { res.status(500).json({ error: "DB unavailable" }); return; }

  // Verify ownership
  const { data: conv } = await client
    .from("conversations")
    .select("id, user_id")
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .single();

  if (!conv) { res.status(403).json({ error: "Only the owner can share" }); return; }

  const { email, permission } = req.body;
  if (!email) { res.status(400).json({ error: "Email required" }); return; }

  // Find target user
  const { data: target } = await client
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (!target) { res.status(404).json({ error: "User not found" }); return; }
  if (target.id === req.userId) { res.status(400).json({ error: "Cannot share with yourself" }); return; }

  const { data, error } = await client
    .from("workspace_shares")
    .upsert({
      conversation_id: req.params.id,
      shared_by: req.userId,
      shared_with: target.id,
      permission: permission || "read",
    }, { onConflict: "conversation_id,shared_with" })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ share: data });
});

/** Remove a share */
router.delete("/api/user/conversations/:id/share/:shareId", async (req, res) => {
  if (!isSupabaseEnabled() || !req.userId) {
    res.status(400).json({ error: "Auth required" });
    return;
  }

  const client = getServiceClient();
  if (!client) { res.status(500).json({ error: "DB unavailable" }); return; }

  const { error } = await client
    .from("workspace_shares")
    .delete()
    .eq("id", req.params.shareId)
    .eq("shared_by", req.userId);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

/** List shares for a conversation */
router.get("/api/user/conversations/:id/shares", async (req, res) => {
  if (!isSupabaseEnabled() || !req.userId) {
    res.json({ shares: [] });
    return;
  }

  const client = getServiceClient();
  if (!client) { res.status(500).json({ error: "DB unavailable" }); return; }

  const { data, error } = await client
    .from("workspace_shares")
    .select("id, shared_with, permission, created_at, profiles!workspace_shares_shared_with_fkey(email, display_name)")
    .eq("conversation_id", req.params.id)
    .eq("shared_by", req.userId);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ shares: data || [] });
});

/** List conversations shared WITH me */
router.get("/api/user/shared-with-me", async (req, res) => {
  if (!isSupabaseEnabled() || !req.userId) {
    res.json({ conversations: [] });
    return;
  }

  const client = getServiceClient();
  if (!client) { res.status(500).json({ error: "DB unavailable" }); return; }

  const { data, error } = await client
    .from("workspace_shares")
    .select("permission, conversations(id, title, source, created_at, updated_at, profiles!conversations_user_id_fkey(email, display_name))")
    .eq("shared_with", req.userId);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ shared: data || [] });
});

export default router;
