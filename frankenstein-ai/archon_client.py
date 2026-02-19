"""
Archon Knowledge Client — Frankenstein AI integration.

Connects to Supabase pgvector knowledge base (Archon-inspired).
Provides RAG search for documentation, code examples, and task management.

Usage:
    from archon_client import ArchonClient
    client = ArchonClient()
    results = client.search("vector similarity search", top_k=5)
"""

import os
import json
import requests
from pathlib import Path
from typing import Optional

# Load env from bridge/.env
_env_path = Path(__file__).parent.parent / "bridge" / ".env"
_env_vars: dict[str, str] = {}
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            _env_vars[k.strip()] = v.strip()

SUPABASE_URL = _env_vars.get("SUPABASE_URL", os.environ.get("SUPABASE_URL", ""))
SUPABASE_KEY = _env_vars.get("SUPABASE_SERVICE_ROLE_KEY", os.environ.get("SUPABASE_SERVICE_ROLE_KEY", ""))
GEMINI_API_KEY = _env_vars.get("GEMINI_API_KEY", os.environ.get("GEMINI_API_KEY", ""))

# Gemini embedding endpoint (text-embedding-004, 768 dim, free)
EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent"


class ArchonClient:
    """Client for Archon-inspired knowledge base in Supabase."""

    def __init__(
        self,
        supabase_url: str = SUPABASE_URL,
        supabase_key: str = SUPABASE_KEY,
        gemini_key: str = GEMINI_API_KEY,
    ):
        self.url = supabase_url.rstrip("/")
        self.key = supabase_key
        self.gemini_key = gemini_key
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def _embed(self, text: str) -> list[float]:
        """Generate embedding via Gemini text-embedding-004 (768 dim)."""
        resp = requests.post(
            f"{EMBED_URL}?key={self.gemini_key}",
            json={"model": "models/text-embedding-004", "content": {"parts": [{"text": text}]}},
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()["embedding"]["values"]

    def _rpc(self, fn: str, params: dict) -> list[dict]:
        """Call a Supabase RPC function."""
        resp = requests.post(
            f"{self.url}/rest/v1/rpc/{fn}",
            headers=self.headers,
            json=params,
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()

    # ── RAG Search ──

    def search(self, query: str, top_k: int = 5, source_id: Optional[str] = None) -> list[dict]:
        """Semantic search in knowledge base.
        
        Returns list of {content, url, section_title, similarity, source_id}.
        """
        embedding = self._embed(query)
        params = {
            "query_embedding": embedding,
            "match_count": top_k,
        }
        if source_id:
            params["filter_source_id"] = source_id

        try:
            return self._rpc("match_knowledge_chunks", params)
        except Exception as e:
            print(f"[archon] Search failed: {e}")
            return []

    def search_code(self, query: str, top_k: int = 5, source_id: Optional[str] = None) -> list[dict]:
        """Search code examples in knowledge base.
        
        Returns list of {code, language, summary, similarity, source_id}.
        """
        embedding = self._embed(query)
        params = {
            "query_embedding": embedding,
            "match_count": top_k,
        }
        if source_id:
            params["filter_source_id"] = source_id

        try:
            return self._rpc("match_code_examples", params)
        except Exception as e:
            print(f"[archon] Code search failed: {e}")
            return []

    # ── Source Management ──

    def list_sources(self) -> list[dict]:
        """List all knowledge sources."""
        resp = requests.get(
            f"{self.url}/rest/v1/knowledge_sources?select=id,title,url,source_type,status,created_at&order=created_at.desc",
            headers=self.headers,
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json()

    def add_source(self, title: str, url: Optional[str] = None, source_type: str = "website") -> dict:
        """Create a new knowledge source."""
        resp = requests.post(
            f"{self.url}/rest/v1/knowledge_sources",
            headers=self.headers,
            json={"title": title, "url": url, "source_type": source_type, "status": "pending"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        return data[0] if isinstance(data, list) else data

    # ── Ingest Content ──

    def ingest_text(self, source_id: str, text: str, url: Optional[str] = None, section_title: Optional[str] = None, chunk_size: int = 1000) -> int:
        """Chunk and embed text into the knowledge base.
        
        Returns number of chunks created.
        """
        chunks = self._chunk_text(text, chunk_size)
        created = 0

        for i, chunk in enumerate(chunks):
            try:
                embedding = self._embed(chunk)
                row = {
                    "source_id": source_id,
                    "content": chunk,
                    "embedding": embedding,
                    "chunk_index": i,
                    "url": url,
                    "section_title": section_title,
                    "word_count": len(chunk.split()),
                }
                resp = requests.post(
                    f"{self.url}/rest/v1/knowledge_chunks",
                    headers=self.headers,
                    json=row,
                    timeout=15,
                )
                resp.raise_for_status()
                created += 1
            except Exception as e:
                print(f"[archon] Failed to ingest chunk {i}: {e}")

        return created

    def ingest_code_example(self, source_id: str, code: str, language: str = "python", summary: Optional[str] = None) -> bool:
        """Add a code example to the knowledge base."""
        try:
            embedding = self._embed(f"{language}: {summary or ''}\n{code[:500]}")
            row = {
                "source_id": source_id,
                "code": code,
                "language": language,
                "summary": summary,
                "embedding": embedding,
            }
            resp = requests.post(
                f"{self.url}/rest/v1/knowledge_code_examples",
                headers=self.headers,
                json=row,
                timeout=15,
            )
            resp.raise_for_status()
            return True
        except Exception as e:
            print(f"[archon] Failed to ingest code example: {e}")
            return False

    # ── Task Management ──

    def list_tasks(self, project_id: Optional[str] = None, status: Optional[str] = None) -> list[dict]:
        """List tasks, optionally filtered by project and status."""
        url = f"{self.url}/rest/v1/archon_tasks?select=*&order=created_at.desc"
        if project_id:
            url += f"&project_id=eq.{project_id}"
        if status:
            url += f"&status=eq.{status}"
        resp = requests.get(url, headers=self.headers, timeout=10)
        resp.raise_for_status()
        return resp.json()

    def create_task(self, title: str, project_id: Optional[str] = None, description: Optional[str] = None, priority: str = "medium") -> dict:
        """Create a new task."""
        row = {"title": title, "priority": priority}
        if project_id:
            row["project_id"] = project_id
        if description:
            row["description"] = description
        resp = requests.post(
            f"{self.url}/rest/v1/archon_tasks",
            headers=self.headers,
            json=row,
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        return data[0] if isinstance(data, list) else data

    def update_task(self, task_id: str, **kwargs) -> dict:
        """Update a task (status, title, description, priority, assignee)."""
        resp = requests.patch(
            f"{self.url}/rest/v1/archon_tasks?id=eq.{task_id}",
            headers=self.headers,
            json=kwargs,
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        return data[0] if isinstance(data, list) else data

    # ── Helpers ──

    @staticmethod
    def _chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
        """Split text into overlapping chunks by word count."""
        words = text.split()
        chunks = []
        i = 0
        while i < len(words):
            chunk = " ".join(words[i : i + chunk_size])
            if chunk.strip():
                chunks.append(chunk)
            i += chunk_size - overlap
        return chunks


# ── Convenience functions ──

_client: Optional[ArchonClient] = None

def get_client() -> ArchonClient:
    global _client
    if _client is None:
        _client = ArchonClient()
    return _client

def search_knowledge(query: str, top_k: int = 5) -> list[dict]:
    """Quick search in knowledge base."""
    return get_client().search(query, top_k)

def search_code_examples(query: str, top_k: int = 5) -> list[dict]:
    """Quick search for code examples."""
    return get_client().search_code(query, top_k)
