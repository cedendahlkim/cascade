"""
Del 4: Hierarkiskt Minnessystem

Implementerar tre nivåer av minne inspirerat av biologiska processer:

1. Korttidsminne: Enkel buffert (senaste N händelser)
2. Episodiskt Minne: ChromaDB vektordatabas med Ebbinghaus glömskekurva
3. Semantiskt Minne: Extraherade mönster/koncept (prototyper i HDC)

Ebbinghaus Glömskekurva:
    R(t) = e^(-t/S)
    Där R = retention, t = tid sedan senaste åtkomst, S = styrka (stability).
    
    - Varje nytt minne får S=1
    - Vid recall: S_{new} = S_{old} + 1 (spacing effect)
    - Minnen med R < threshold rensas ("kall lagring")
"""

import time
import math
import json
import os
import numpy as np

# ChromaDB är optional — fallback till in-memory med JSON-persistens
try:
    import chromadb
    HAS_CHROMADB = True
except ImportError:
    HAS_CHROMADB = False
    print("[memory] ChromaDB ej installerat — använder in-memory fallback med JSON-persistens")

# Default persist directory (inside training_data so Docker volume covers it)
_DEFAULT_PERSIST_DIR = os.path.join(
    os.path.dirname(__file__), "training_data", "chromadb"
)
_DEFAULT_FALLBACK_FILE = os.path.join(
    os.path.dirname(__file__), "training_data", "ebbinghaus_memory.json"
)


class EbbinghausMemory:
    """Minneshanterare med Ebbinghaus glömskekurva.
    
    Varje minne har:
    - embedding: Vektorrepresentation (hypervektor från HDC)
    - metadata: timestamp, strength, concept, etc.
    - retention: Beräknas dynamiskt baserat på tid och styrka
    
    Persistens:
    - ChromaDB: PersistentClient sparar till disk automatiskt
    - Fallback: JSON-fil sparas periodiskt och vid garbage_collect
    """

    def __init__(
        self,
        decay_threshold: float = 0.1,
        collection_name: str = "episodic_log",
        persist_dir: str | None = None,
        fallback_file: str | None = None,
    ):
        self.decay_threshold = decay_threshold
        self.collection_name = collection_name
        self._fallback_file = fallback_file or _DEFAULT_FALLBACK_FILE
        self._persist_counter = 0

        if HAS_CHROMADB:
            chroma_dir = persist_dir or _DEFAULT_PERSIST_DIR
            os.makedirs(chroma_dir, exist_ok=True)
            self.client = chromadb.PersistentClient(path=chroma_dir)
            self.collection = self.client.get_or_create_collection(
                name=collection_name,
                metadata={"hnsw:space": "cosine"},
            )
            existing = self.collection.count()
            if existing > 0:
                print(f"[memory] Loaded {existing} persistent memories from {chroma_dir}")
        else:
            # In-memory fallback with JSON persistence
            self.memories: list[dict] = []
            self._load_fallback()

        self.total_stored = 0
        self.total_recalled = 0
        self.total_decayed = 0

    def _load_fallback(self) -> None:
        """Load memories from JSON fallback file."""
        if os.path.exists(self._fallback_file):
            try:
                with open(self._fallback_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self.memories = data.get("memories", [])
                self.total_stored = data.get("total_stored", len(self.memories))
                self.total_recalled = data.get("total_recalled", 0)
                self.total_decayed = data.get("total_decayed", 0)
                print(f"[memory] Loaded {len(self.memories)} memories from {self._fallback_file}")
            except Exception as e:
                print(f"[memory] Warning: Could not load {self._fallback_file}: {e}")
                self.memories = []

    def _save_fallback(self) -> None:
        """Save memories to JSON fallback file."""
        if HAS_CHROMADB:
            return  # ChromaDB handles its own persistence
        try:
            os.makedirs(os.path.dirname(self._fallback_file), exist_ok=True)
            with open(self._fallback_file, "w", encoding="utf-8") as f:
                json.dump({
                    "memories": self.memories,
                    "total_stored": self.total_stored,
                    "total_recalled": self.total_recalled,
                    "total_decayed": self.total_decayed,
                    "saved_at": time.time(),
                }, f, ensure_ascii=False)
        except Exception as e:
            print(f"[memory] Warning: Could not save {self._fallback_file}: {e}")

    def retention(self, time_elapsed: float, strength: float) -> float:
        """Beräkna retention enligt Ebbinghaus formel.
        
        R(t) = e^(-t / (S * SCALE))
        
        Strength är en abstrakt enhet. SCALE konverterar till sekunder:
        strength=10 → överlever ~10 timmar (36 000s).
        
        Args:
            time_elapsed: Sekunder sedan senaste åtkomst
            strength: Minnets styrka (ökar vid recall)
            
        Returns:
            retention: Värde mellan 0 och 1
        """
        STRENGTH_SCALE = 3600  # 1 strength-enhet = 1 timme
        if strength <= 0:
            return 0.0
        return math.exp(-time_elapsed / max(strength * STRENGTH_SCALE, 0.01))

    def store(
        self,
        embedding: np.ndarray | list[float],
        concept: str = "unknown",
        metadata: dict | None = None,
    ) -> str:
        """Spara ett nytt episodiskt minne.
        
        Args:
            embedding: Vektorrepresentation (t.ex. hypervektor)
            concept: Konceptetikett
            metadata: Extra metadata
            
        Returns:
            memory_id: Unikt ID för minnet
        """
        if isinstance(embedding, np.ndarray):
            embedding = embedding.tolist()

        # Begränsa dimensionalitet för ChromaDB (max ~2000 dims effektivt)
        if len(embedding) > 1024:
            # Subsampla jämnt fördelat
            indices = np.linspace(0, len(embedding) - 1, 1024, dtype=int)
            embedding = [embedding[i] for i in indices]

        now = time.time()
        memory_id = f"mem_{now}_{self.total_stored}"

        mem_metadata = {
            "timestamp": now,
            "strength": 1.0,
            "concept": concept,
            "last_access": now,
            "access_count": 0,
        }
        if metadata:
            mem_metadata.update(metadata)

        if HAS_CHROMADB:
            self.collection.add(
                embeddings=[embedding],
                metadatas=[mem_metadata],
                ids=[memory_id],
            )
        else:
            self.memories.append({
                "id": memory_id,
                "embedding": embedding,
                "metadata": mem_metadata,
            })

        self.total_stored += 1

        # Periodic persistence (every 50 stores)
        self._persist_counter += 1
        if self._persist_counter % 50 == 0:
            self._save_fallback()

        return memory_id

    def recall(
        self, query_embedding: np.ndarray | list[float], n_results: int = 5
    ) -> list[dict]:
        """Hämta relevanta minnen via vektorsökning.
        
        Vid recall förstärks minnet (spacing effect):
        S_{new} = S_{old} + 1
        
        Args:
            query_embedding: Sökvektor
            n_results: Max antal resultat
            
        Returns:
            results: Lista med {id, concept, strength, retention, distance}
        """
        if isinstance(query_embedding, np.ndarray):
            query_embedding = query_embedding.tolist()

        if len(query_embedding) > 1024:
            indices = np.linspace(0, len(query_embedding) - 1, 1024, dtype=int)
            query_embedding = [query_embedding[i] for i in indices]

        now = time.time()
        results = []

        if HAS_CHROMADB:
            try:
                count = self.collection.count()
                if count == 0:
                    return []
                query_results = self.collection.query(
                    query_embeddings=[query_embedding],
                    n_results=min(n_results, count),
                )
            except Exception:
                return []

            if query_results and query_results["ids"]:
                for i, mem_id in enumerate(query_results["ids"][0]):
                    meta = query_results["metadatas"][0][i]
                    distance = query_results["distances"][0][i] if query_results["distances"] else 0

                    # Beräkna retention
                    time_elapsed = now - meta.get("last_access", now)
                    strength = meta.get("strength", 1.0)
                    ret = self.retention(time_elapsed, strength)

                    if ret >= self.decay_threshold:
                        # Förstärk minnet (spacing effect — multiplikativ)
                        new_strength = strength * 1.5
                        self.collection.update(
                            ids=[mem_id],
                            metadatas=[{
                                **meta,
                                "strength": new_strength,
                                "last_access": now,
                                "access_count": meta.get("access_count", 0) + 1,
                            }],
                        )

                        results.append({
                            "id": mem_id,
                            "concept": meta.get("concept", "unknown"),
                            "strength": new_strength,
                            "retention": ret,
                            "distance": distance,
                        })

        else:
            # In-memory fallback med enkel cosine similarity
            if not self.memories:
                return []

            query_vec = np.array(query_embedding)
            scored = []
            for mem in self.memories:
                mem_vec = np.array(mem["embedding"])
                # Cosine similarity
                dot = np.dot(query_vec, mem_vec)
                norm = np.linalg.norm(query_vec) * np.linalg.norm(mem_vec)
                sim = dot / max(norm, 1e-10)

                meta = mem["metadata"]
                time_elapsed = now - meta.get("last_access", now)
                strength = meta.get("strength", 1.0)
                ret = self.retention(time_elapsed, strength)

                if ret >= self.decay_threshold:
                    scored.append((sim, mem, ret))

            scored.sort(key=lambda x: x[0], reverse=True)
            for sim, mem, ret in scored[:n_results]:
                meta = mem["metadata"]
                meta["strength"] = meta["strength"] * 1.5
                meta["last_access"] = now
                meta["access_count"] = meta.get("access_count", 0) + 1

                results.append({
                    "id": mem["id"],
                    "concept": meta.get("concept", "unknown"),
                    "strength": meta["strength"],
                    "retention": ret,
                    "distance": 1 - sim,
                })

        self.total_recalled += len(results)
        return results

    def garbage_collect(self) -> int:
        """Rensa minnen med låg retention (Ebbinghaus decay).
        
        Returns:
            removed: Antal borttagna minnen
        """
        now = time.time()
        removed = 0

        if HAS_CHROMADB:
            try:
                all_data = self.collection.get()
            except Exception:
                return 0

            if all_data and all_data["ids"]:
                ids_to_remove = []
                for i, mem_id in enumerate(all_data["ids"]):
                    meta = all_data["metadatas"][i]
                    time_elapsed = now - meta.get("last_access", now)
                    strength = meta.get("strength", 1.0)
                    ret = self.retention(time_elapsed, strength)

                    if ret < self.decay_threshold:
                        ids_to_remove.append(mem_id)

                if ids_to_remove:
                    self.collection.delete(ids=ids_to_remove)
                    removed = len(ids_to_remove)
        else:
            surviving = []
            for mem in self.memories:
                meta = mem["metadata"]
                time_elapsed = now - meta.get("last_access", now)
                strength = meta.get("strength", 1.0)
                ret = self.retention(time_elapsed, strength)

                if ret >= self.decay_threshold:
                    surviving.append(mem)
                else:
                    removed += 1
            self.memories = surviving

        self.total_decayed += removed
        if removed > 0:
            self._save_fallback()
        return removed

    def get_stats(self) -> dict:
        """Returnera minnesstatistik."""
        if HAS_CHROMADB:
            try:
                count = self.collection.count()
            except Exception:
                count = 0
        else:
            count = len(self.memories)

        return {
            "active_memories": count,
            "total_stored": self.total_stored,
            "total_recalled": self.total_recalled,
            "total_decayed": self.total_decayed,
            "backend": "chromadb" if HAS_CHROMADB else "in-memory",
        }


class ShortTermBuffer:
    """Enkel korttidsminnebuffert (FIFO).
    
    Håller de senaste N händelserna för omedelbar kontext.
    """

    def __init__(self, capacity: int = 20):
        self.capacity = capacity
        self.buffer: list[dict] = []

    def add(self, event: dict) -> None:
        """Lägg till en händelse."""
        event["timestamp"] = time.time()
        self.buffer.append(event)
        if len(self.buffer) > self.capacity:
            self.buffer.pop(0)

    def get_recent(self, n: int = 5) -> list[dict]:
        """Hämta de N senaste händelserna."""
        return self.buffer[-n:]

    def clear(self) -> None:
        """Rensa bufferten."""
        self.buffer.clear()

    @property
    def size(self) -> int:
        return len(self.buffer)
