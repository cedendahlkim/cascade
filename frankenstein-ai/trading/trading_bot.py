"""Frankenstein AI Trading Bot.

MVP goals:
- Paper trading by default (no real money).
- Pull OHLCV from Binance public endpoints.
- Generate signals using the HDC + Active Inference + Ebbinghaus memory approach from the uploaded draft.
- Persist state + logs under TRADING_DATA_DIR (defaults to /workspace/frankenstein-ai/trading_data in docker).
- Send live events to the Bridge (optional) so the web UI can show progress.

Security:
- Live trading is disabled unless TRADING_ALLOW_LIVE=true.
- Never print API keys.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import hmac
import json
import os
import signal
import sys
import time
import urllib.parse
from collections import deque
from dataclasses import dataclass, asdict, field
from datetime import datetime
from pathlib import Path
from typing import Any, Optional, Protocol

import numpy as np
import requests


def _utc_now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


# Force UTF-8 output for redirected processes
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


DATA_DIR = Path(os.environ.get("TRADING_DATA_DIR", "/workspace/frankenstein-ai/trading_data"))
STATE_FILE = DATA_DIR / "state.json"
LOG_FILE = DATA_DIR / "trader.log"
TRADES_FILE = DATA_DIR / "trades.jsonl"

BRIDGE_URL = os.environ.get("BRIDGE_URL", "http://localhost:3031")


def _load_env_file(path: Path) -> None:
    """Minimal .env loader (no dependencies).

    Loads KEY=VALUE pairs and sets them in os.environ if missing.
    """

    if not path.exists() or not path.is_file():
        return
    try:
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if not key:
                continue
            if key not in os.environ:
                os.environ[key] = value
    except Exception:
        return


# Load env overrides (prefer workspace-mounted secrets in docker)
_load_env_file(Path("/workspace/frankenstein-ai/.env.local"))
_load_env_file(Path("/workspace/frankenstein-ai/.env"))

# Fallback to env files next to the codebase (useful for local runs)
_local_root = Path(__file__).resolve().parents[1]
_load_env_file(_local_root / ".env.local")
_load_env_file(_local_root / ".env")


def _ensure_dirs() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _log(line: str) -> None:
    _ensure_dirs()
    ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    msg = f"[{ts}] {line}"
    print(msg, flush=True)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(msg + "\n")
    except Exception:
        pass


def _send_bridge_event(event: dict) -> None:
    """Fire-and-forget event delivery to Bridge."""
    try:
        payload = json.dumps({"event": event}).encode("utf-8")
        requests.post(
            f"{BRIDGE_URL}/api/trader/event",
            data=payload,
            headers={"Content-Type": "application/json"},
            timeout=2,
        )
    except Exception:
        pass


@dataclass
class TradeSignal:
    symbol: str
    action: str  # BUY | SELL | HOLD
    confidence: float  # 0-1
    quantity: float
    price: float
    reason: str
    pattern: str = "unknown"
    pattern_similarity: float = 0.0
    details: dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=_utc_now_iso)


@dataclass
class TradeMemory:
    signal: TradeSignal
    outcome: Optional[float] = None
    remembered_strength: float = 1.0


class HDCMarketEncoder:
    """Encodes normalized market features to a binary hypervector."""

    DIM = 10_000

    def __init__(self) -> None:
        rng = np.random.default_rng(42)
        self._basis = {
            feat: rng.integers(0, 2, self.DIM, dtype=np.int8)
            for feat in [
                "open",
                "high",
                "low",
                "close",
                "volume",
                "rsi",
                "macd",
                "bb_upper",
                "bb_lower",
                "trend",
                "volatility",
            ]
        }
        self.pattern_memory: dict[str, np.ndarray] = {}

    def _quantize(self, value: float, bins: int = 100) -> int:
        return min(int(value * bins), bins - 1)

    def encode(self, features: dict[str, float]) -> np.ndarray:
        hvs: list[np.ndarray] = []
        for feat, val in features.items():
            if feat not in self._basis:
                continue
            shift = self._quantize(float(val))
            hv = np.roll(self._basis[feat], shift)
            hvs.append(hv)

        if not hvs:
            return np.zeros(self.DIM, dtype=np.int8)

        result = hvs[0].copy()
        for hv in hvs[1:]:
            result = np.bitwise_xor(result, hv)
        return result

    def similarity(self, hv1: np.ndarray, hv2: np.ndarray) -> float:
        return float(1.0 - np.mean(np.bitwise_xor(hv1, hv2)))

    def store_pattern(self, name: str, hv: np.ndarray) -> None:
        self.pattern_memory[name] = hv

    def best_match(self, hv: np.ndarray) -> tuple[str, float]:
        best, best_sim = "unknown", 0.0
        for name, stored in self.pattern_memory.items():
            sim = self.similarity(hv, stored)
            if sim > best_sim:
                best, best_sim = name, sim
        return best, float(best_sim)


class ActiveInferenceDecider:
    STATES = ["bull", "bear", "sideways", "volatile"]

    # NOTE: Features are normalized into roughly [0, 1] and trend is centered around 0.5.
    # The original thresholds (0.65/0.35) almost never triggered BUY/SELL, causing the bot
    # to get stuck in HOLD even when HDC patterns detected breakouts.
    TREND_BULL_EDGE = 0.54
    TREND_BEAR_EDGE = 0.46
    VOLATILE_EDGE = 0.70
    TRADE_STATE_PROB_EDGE = 0.52

    def __init__(self) -> None:
        self.state_prior = np.array([0.30, 0.30, 0.30, 0.10], dtype=np.float64)
        self.likelihood = np.array(
            [
                [0.70, 0.10, 0.15, 0.05],
                [0.10, 0.70, 0.15, 0.05],
                [0.20, 0.20, 0.50, 0.10],
                [0.15, 0.15, 0.10, 0.60],
            ],
            dtype=np.float64,
        )

    def _classify_observation(self, features: dict[str, float]) -> int:
        trend = float(features.get("trend", 0.5))
        volatility = float(features.get("volatility", 0.3))
        if volatility >= self.VOLATILE_EDGE:
            return 3
        if trend >= self.TREND_BULL_EDGE:
            return 0
        if trend <= self.TREND_BEAR_EDGE:
            return 1
        return 2

    def infer_state(self, features: dict[str, float]) -> dict[str, float]:
        obs_idx = self._classify_observation(features)
        likelihood_obs = self.likelihood[obs_idx]
        posterior = likelihood_obs * self.state_prior
        posterior = posterior / posterior.sum()

        self.state_prior = 0.9 * self.state_prior + 0.1 * posterior

        return {state: float(prob) for state, prob in zip(self.STATES, posterior)}

    def decide(self, posterior: dict[str, float], max_risk: float) -> tuple[str, float]:
        bull_p = float(posterior.get("bull", 0.0))
        bear_p = float(posterior.get("bear", 0.0))
        vol_p = float(posterior.get("volatile", 0.0))

        vol_penalty = vol_p * 0.5

        if bull_p >= self.TRADE_STATE_PROB_EDGE and vol_penalty < 0.2:
            return "BUY", round(bull_p - vol_penalty, 3)
        if bear_p >= self.TRADE_STATE_PROB_EDGE and vol_penalty < 0.2:
            return "SELL", round(bear_p - vol_penalty, 3)

        # HOLD confidence can still be meaningful for monitoring.
        return "HOLD", round(max(bull_p, bear_p, 0.3), 3)


class EbbinghausTradeMemory:
    DECAY_RATE_PER_HOUR = 0.05
    CAPACITY = 1_000

    def __init__(self) -> None:
        self.memories: deque[TradeMemory] = deque(maxlen=self.CAPACITY)

    def remember(self, signal: TradeSignal) -> None:
        self.memories.append(TradeMemory(signal=signal))

    def update_outcome(self, symbol: str, profit_pct: float) -> None:
        """Attach an outcome to the most recent unresolved memory for the symbol."""

        for mem in reversed(self.memories):
            if mem.signal.symbol != symbol:
                continue
            if mem.outcome is not None:
                continue
            mem.outcome = float(profit_pct)
            # Reinforce good outcomes, weaken bad outcomes (bounded)
            mem.remembered_strength = 1.0 + max(-0.5, min(1.0, float(profit_pct) / 10.0))
            break

    def apply_decay(self, hours_elapsed: float) -> None:
        if hours_elapsed <= 0:
            return
        decay = float(np.exp(-self.DECAY_RATE_PER_HOUR * hours_elapsed))
        for mem in self.memories:
            mem.remembered_strength *= decay

    def get_success_rate(self, symbol: str, last_n: int = 20) -> float:
        relevant = [m for m in self.memories if m.signal.symbol == symbol and m.outcome is not None][-last_n:]
        if not relevant:
            return 0.5
        weighted_wins = sum(m.remembered_strength for m in relevant if (m.outcome or 0) > 0)
        total_weight = sum(m.remembered_strength for m in relevant)
        if total_weight <= 0:
            return 0.5
        return float(weighted_wins / total_weight)

    def stats(self) -> dict[str, Any]:
        completed = [m for m in self.memories if m.outcome is not None]
        if not completed:
            return {"total": 0, "win_rate": 0.0, "avg_profit": 0.0}
        wins = [m for m in completed if (m.outcome or 0) > 0]
        outcomes = [float(m.outcome or 0.0) for m in completed]
        return {
            "total": len(completed),
            "win_rate": round(len(wins) / len(completed), 3),
            "avg_profit": round(float(np.mean(outcomes)), 3),
            "best_trade": round(max(outcomes), 3),
            "worst_trade": round(min(outcomes), 3),
        }


class ExchangeClient(Protocol):
    """Minimal exchange contract used by FrankensteinTradingAgent.

    This keeps the bot switchable (Binance/Kraken/...) without rewriting the
    cognitive logic.
    """

    paper_mode: bool
    name: str

    def get_klines(self, symbol: str, interval: str = "1h", limit: int = 100) -> list: ...

    def get_price(self, symbol: str) -> float: ...

    def place_order(self, symbol: str, side: str, quantity: float, price: float) -> dict[str, Any]: ...

    def get_portfolio_value(self) -> dict[str, Any]: ...


class BinanceClient:
    def __init__(
        self,
        api_key: str,
        api_secret: str,
        paper_mode: bool,
        base_url: str,
        allow_live: bool,
        starting_usdt: float = 10_000.0,
    ) -> None:
        self.name = "binance"
        self.api_key = api_key
        self.api_secret = api_secret
        self.paper_mode = paper_mode
        self.base_url = base_url.rstrip("/")
        self.allow_live = allow_live

        self._paper_balance = {"USDT": float(starting_usdt)}
        # symbol -> { qty, avg_price, realized_usdt }
        self._paper_positions: dict[str, dict[str, float]] = {}

    def _headers(self) -> dict[str, str]:
        return {"X-MBX-APIKEY": self.api_key} if self.api_key else {}

    def _sign(self, query: str) -> str:
        return hmac.new(self.api_secret.encode("utf-8"), query.encode("utf-8"), hashlib.sha256).hexdigest()

    def _get(self, path: str, params: dict[str, Any] | None = None, timeout: int = 10) -> Any:
        url = f"{self.base_url}{path}"
        r = requests.get(url, params=params or {}, timeout=timeout)
        r.raise_for_status()
        return r.json()

    def _post_signed(self, path: str, params: dict[str, Any], timeout: int = 10) -> Any:
        if not self.api_key or not self.api_secret:
            raise RuntimeError("Missing BINANCE_API_KEY/BINANCE_API_SECRET")
        if not self.allow_live:
            raise RuntimeError("Live trading disabled (set TRADING_ALLOW_LIVE=true to enable)")

        params = dict(params)
        params["timestamp"] = int(time.time() * 1000)
        query = "&".join([f"{k}={params[k]}" for k in sorted(params.keys())])
        sig = self._sign(query)
        url = f"{self.base_url}{path}?{query}&signature={sig}"
        r = requests.post(url, headers=self._headers(), timeout=timeout)
        r.raise_for_status()
        return r.json()

    def get_klines(self, symbol: str, interval: str = "1h", limit: int = 100) -> list:
        return self._get("/api/v3/klines", {"symbol": symbol, "interval": interval, "limit": limit})

    def get_price(self, symbol: str) -> float:
        data = self._get("/api/v3/ticker/price", {"symbol": symbol})
        return float(data["price"])

    def place_order(self, symbol: str, side: str, quantity: float, price: float) -> dict[str, Any]:
        if self.paper_mode:
            cost = float(quantity) * float(price)
            status = "REJECTED"
            realized_usdt = 0.0
            realized_pct: Optional[float] = None
            avg_entry: Optional[float] = None
            if side == "BUY":
                if self._paper_balance.get("USDT", 0.0) >= cost:
                    self._paper_balance["USDT"] -= cost
                    pos = self._paper_positions.get(symbol) or {"qty": 0.0, "avg_price": 0.0, "realized_usdt": 0.0}
                    old_qty = float(pos.get("qty", 0.0))
                    old_avg = float(pos.get("avg_price", 0.0))
                    new_qty = old_qty + float(quantity)
                    new_avg = ((old_qty * old_avg) + (float(quantity) * float(price))) / (new_qty + 1e-12)
                    pos["qty"] = new_qty
                    pos["avg_price"] = new_avg
                    self._paper_positions[symbol] = pos
                    avg_entry = new_avg
                    status = "FILLED"
                else:
                    status = "REJECTED (insufficient funds)"
            elif side == "SELL":
                pos = self._paper_positions.get(symbol)
                held = float(pos.get("qty", 0.0)) if pos else 0.0
                if held >= quantity and pos:
                    avg_entry = float(pos.get("avg_price", 0.0))
                    cost_basis = float(quantity) * avg_entry
                    realized_usdt = float(cost) - cost_basis
                    realized_pct = (realized_usdt / (cost_basis + 1e-12)) * 100.0

                    pos["qty"] = held - float(quantity)
                    pos["realized_usdt"] = float(pos.get("realized_usdt", 0.0)) + realized_usdt
                    if pos["qty"] <= 1e-12:
                        # Close position
                        self._paper_positions.pop(symbol, None)
                    else:
                        self._paper_positions[symbol] = pos

                    self._paper_balance["USDT"] += cost
                    status = "FILLED"
                else:
                    status = "REJECTED (no position)"
            else:
                status = "REJECTED (unknown side)"

            return {
                "mode": "paper",
                "status": status,
                "symbol": symbol,
                "side": side,
                "quantity": float(quantity),
                "price": float(price),
                "avg_entry": avg_entry,
                "realized_usdt": round(realized_usdt, 6),
                "realized_pct": round(realized_pct, 4) if realized_pct is not None else None,
            }

        # Live trading (spot)
        params = {
            "symbol": symbol,
            "side": side,
            "type": "MARKET",
            "quantity": quantity,
        }
        return self._post_signed("/api/v3/order", params)

    def get_portfolio_value(self) -> dict[str, Any]:
        total = float(self._paper_balance.get("USDT", 0.0))
        positions: dict[str, Any] = {}
        for sym, pos in self._paper_positions.items():
            qty = float(pos.get("qty", 0.0))
            if qty <= 0.0:
                continue
            price = self.get_price(sym)
            avg_entry = float(pos.get("avg_price", 0.0))
            val = qty * price
            cost_basis = qty * avg_entry
            unrealized = val - cost_basis
            unrealized_pct = (unrealized / (cost_basis + 1e-12)) * 100.0 if cost_basis > 0 else 0.0
            total += val
            positions[sym] = {
                "quantity": round(qty, 8),
                "avg_entry": round(avg_entry, 8),
                "price": round(float(price), 8),
                "value_usd": round(val, 2),
                "unrealized_usdt": round(unrealized, 6),
                "unrealized_pct": round(unrealized_pct, 4),
                "realized_usdt": round(float(pos.get("realized_usdt", 0.0)), 6),
            }
        return {
            "usdt_cash": round(float(self._paper_balance.get("USDT", 0.0)), 2),
            "positions": positions,
            "total_value_usd": round(total, 2),
        }


class KrakenClient:
    """Kraken REST client (public data + optional private order placement).

    Notes:
    - Paper mode does NOT require API keys (we use public OHLC/Ticker endpoints).
    - Live trading is gated by TRADING_ALLOW_LIVE=true and requires keys.
    """

    _SUPPORTED_INTERVAL_MINUTES = {1, 5, 15, 30, 60, 240, 1440, 10080, 21600}

    def __init__(
        self,
        api_key: str,
        api_secret: str,
        paper_mode: bool,
        base_url: str,
        allow_live: bool,
        starting_usdt: float = 10_000.0,
    ) -> None:
        self.name = "kraken"
        self.api_key = api_key
        self.api_secret = api_secret
        self.paper_mode = paper_mode
        self.base_url = base_url.rstrip("/")
        self.allow_live = allow_live

        self._paper_balance = {"USDT": float(starting_usdt)}
        # symbol -> { qty, avg_price, realized_usdt }
        self._paper_positions: dict[str, dict[str, float]] = {}

    @staticmethod
    def _normalize_pair(symbol: str) -> str:
        s = symbol.strip().upper()
        if s.startswith("BTC"):
            s = "XBT" + s[3:]
        return s

    @classmethod
    def _interval_to_minutes(cls, interval: str) -> int:
        raw = (interval or "").strip().lower()
        if not raw:
            return 60

        # Accept Binance-style strings: 1m/5m/15m/1h/4h/1d
        unit = raw[-1]
        if unit in ("m", "h", "d"):
            try:
                n = int(raw[:-1])
            except ValueError:
                n = 60
            minutes = n if unit == "m" else (n * 60 if unit == "h" else n * 1440)
        else:
            # If already a number, assume minutes.
            try:
                minutes = int(raw)
            except ValueError:
                minutes = 60

        return minutes if minutes in cls._SUPPORTED_INTERVAL_MINUTES else 60

    def _get_public(self, path: str, params: dict[str, Any] | None = None, timeout: int = 10) -> Any:
        url = f"{self.base_url}{path}"
        r = requests.get(url, params=params or {}, timeout=timeout)
        r.raise_for_status()
        data = r.json()
        errors = data.get("error") if isinstance(data, dict) else None
        if errors:
            raise RuntimeError(f"Kraken error: {errors}")
        return data.get("result") if isinstance(data, dict) else data

    def _sign_private(self, url_path: str, data: dict[str, Any]) -> str:
        # Kraken secret is base64-encoded.
        postdata = urllib.parse.urlencode(data)
        encoded = (str(data["nonce"]) + postdata).encode("utf-8")
        message = url_path.encode("utf-8") + hashlib.sha256(encoded).digest()
        mac = hmac.new(base64.b64decode(self.api_secret), message, hashlib.sha512)
        return base64.b64encode(mac.digest()).decode("utf-8")

    def _post_private(self, path: str, data: dict[str, Any], timeout: int = 10) -> Any:
        if not self.api_key or not self.api_secret:
            raise RuntimeError("Missing KRAKEN_API_KEY/KRAKEN_API_SECRET")
        if not self.allow_live:
            raise RuntimeError("Live trading disabled (set TRADING_ALLOW_LIVE=true to enable)")

        payload = dict(data)
        payload["nonce"] = int(time.time() * 1000)

        headers = {
            "API-Key": self.api_key,
            "API-Sign": self._sign_private(path, payload),
        }

        url = f"{self.base_url}{path}"
        r = requests.post(url, data=payload, headers=headers, timeout=timeout)
        r.raise_for_status()
        out = r.json()
        if isinstance(out, dict) and out.get("error"):
            raise RuntimeError(f"Kraken error: {out.get('error')}")
        return out

    def get_klines(self, symbol: str, interval: str = "1h", limit: int = 100) -> list:
        pair = self._normalize_pair(symbol)
        interval_min = self._interval_to_minutes(interval)
        result = self._get_public("/0/public/OHLC", {"pair": pair, "interval": interval_min})
        if not isinstance(result, dict):
            return []

        key = next((k for k in result.keys() if k != "last"), None)
        rows = result.get(key) if key else None
        if not isinstance(rows, list):
            return []

        out: list[list[Any]] = []
        for r in rows[-limit:]:
            try:
                # [time, open, high, low, close, vwap, volume, count]
                out.append([
                    int(float(r[0]) * 1000),
                    float(r[1]),
                    float(r[2]),
                    float(r[3]),
                    float(r[4]),
                    float(r[6]),
                ])
            except Exception:
                continue
        return out

    def get_price(self, symbol: str) -> float:
        pair = self._normalize_pair(symbol)
        result = self._get_public("/0/public/Ticker", {"pair": pair})
        if not isinstance(result, dict) or not result:
            raise RuntimeError(f"Kraken ticker missing for {pair}")

        key = next(iter(result.keys()))
        data = result.get(key) or {}
        last = (data.get("c") or [None])[0]
        return float(last)

    def place_order(self, symbol: str, side: str, quantity: float, price: float) -> dict[str, Any]:
        if self.paper_mode:
            cost = float(quantity) * float(price)
            status = "REJECTED"
            realized_usdt = 0.0
            realized_pct: Optional[float] = None
            avg_entry: Optional[float] = None
            if side == "BUY":
                if self._paper_balance.get("USDT", 0.0) >= cost:
                    self._paper_balance["USDT"] -= cost
                    pos = self._paper_positions.get(symbol) or {"qty": 0.0, "avg_price": 0.0, "realized_usdt": 0.0}
                    old_qty = float(pos.get("qty", 0.0))
                    old_avg = float(pos.get("avg_price", 0.0))
                    new_qty = old_qty + float(quantity)
                    new_avg = ((old_qty * old_avg) + (float(quantity) * float(price))) / (new_qty + 1e-12)
                    pos["qty"] = new_qty
                    pos["avg_price"] = new_avg
                    self._paper_positions[symbol] = pos
                    avg_entry = new_avg
                    status = "FILLED"
                else:
                    status = "REJECTED (insufficient funds)"
            elif side == "SELL":
                pos = self._paper_positions.get(symbol)
                held = float(pos.get("qty", 0.0)) if pos else 0.0
                if held >= quantity and pos:
                    avg_entry = float(pos.get("avg_price", 0.0))
                    cost_basis = float(quantity) * avg_entry
                    realized_usdt = float(cost) - cost_basis
                    realized_pct = (realized_usdt / (cost_basis + 1e-12)) * 100.0

                    pos["qty"] = held - float(quantity)
                    pos["realized_usdt"] = float(pos.get("realized_usdt", 0.0)) + realized_usdt
                    if pos["qty"] <= 1e-12:
                        self._paper_positions.pop(symbol, None)
                    else:
                        self._paper_positions[symbol] = pos

                    self._paper_balance["USDT"] += cost
                    status = "FILLED"
                else:
                    status = "REJECTED (no position)"
            else:
                status = "REJECTED (unknown side)"

            return {
                "mode": "paper",
                "status": status,
                "symbol": symbol,
                "side": side,
                "quantity": float(quantity),
                "price": float(price),
                "avg_entry": avg_entry,
                "realized_usdt": round(realized_usdt, 6),
                "realized_pct": round(realized_pct, 4) if realized_pct is not None else None,
            }

        pair = self._normalize_pair(symbol)
        payload = {
            "pair": pair,
            "type": side.lower(),
            "ordertype": "market",
            "volume": str(quantity),
        }
        return self._post_private("/0/private/AddOrder", payload)

    def get_portfolio_value(self) -> dict[str, Any]:
        total = float(self._paper_balance.get("USDT", 0.0))
        positions: dict[str, Any] = {}
        for sym, pos in self._paper_positions.items():
            qty = float(pos.get("qty", 0.0))
            if qty <= 0.0:
                continue
            price = self.get_price(sym)
            avg_entry = float(pos.get("avg_price", 0.0))
            val = qty * price
            cost_basis = qty * avg_entry
            unrealized = val - cost_basis
            unrealized_pct = (unrealized / (cost_basis + 1e-12)) * 100.0 if cost_basis > 0 else 0.0
            total += val
            positions[sym] = {
                "quantity": round(qty, 8),
                "avg_entry": round(avg_entry, 8),
                "price": round(float(price), 8),
                "value_usd": round(val, 2),
                "unrealized_usdt": round(unrealized, 6),
                "unrealized_pct": round(unrealized_pct, 4),
                "realized_usdt": round(float(pos.get("realized_usdt", 0.0)), 6),
            }
        return {
            "usdt_cash": round(float(self._paper_balance.get("USDT", 0.0)), 2),
            "positions": positions,
            "total_value_usd": round(total, 2),
        }


def compute_rsi(closes: list[float], period: int = 14) -> float:
    if len(closes) < period + 1:
        return 50.0
    deltas = np.diff(closes)
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)
    avg_gain = float(np.mean(gains[-period:]))
    avg_loss = float(np.mean(losses[-period:]))
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(100 - (100 / (1 + rs)), 2)


def compute_features(klines: list) -> dict[str, float]:
    if not klines or len(klines) < 20:
        return {}

    closes = [float(k[4]) for k in klines]
    volumes = [float(k[5]) for k in klines]

    price = closes[-1]
    price_min, price_max = min(closes[-50:]), max(closes[-50:])
    vol_min, vol_max = min(volumes[-20:]), max(volumes[-20:])

    rsi = compute_rsi(closes)
    sma20 = float(np.mean(closes[-20:]))
    sma5 = float(np.mean(closes[-5:]))
    std20 = float(np.std(closes[-20:]))

    trend = (sma5 - sma20) / (sma20 + 1e-10) + 0.5
    volatility = std20 / (price + 1e-10)

    bb_upper = (price - (sma20 + 2 * std20)) / (std20 + 1e-10) + 0.5
    bb_lower = (price - (sma20 - 2 * std20)) / (std20 + 1e-10) + 0.5
    macd = (sma5 - sma20) / (sma20 + 1e-10) + 0.5

    return {
        "close": float((price - price_min) / (price_max - price_min + 1e-10)),
        "volume": float((volumes[-1] - vol_min) / (vol_max - vol_min + 1e-10)),
        "rsi": float(rsi / 100.0),
        "trend": float(np.clip(trend, 0, 1)),
        "volatility": float(np.clip(volatility * 10, 0, 1)),
        "bb_upper": float(np.clip(bb_upper, 0, 1)),
        "bb_lower": float(np.clip(bb_lower, 0, 1)),
        "macd": float(np.clip(macd, 0, 1)),
        # Not used in MVP feature extraction, but kept for HDC basis completeness
        "open": 0.5,
        "high": 0.5,
        "low": 0.5,
    }


class FrankensteinTradingAgent:
    def __init__(
        self,
        exchange: ExchangeClient,
        symbols: list[str],
        risk_per_trade: float,
        min_confidence: float,
    ) -> None:
        self.exchange = exchange
        self.symbols = symbols
        self.risk_per_trade = float(risk_per_trade)
        self.min_confidence = float(min_confidence)

        self.hdc = HDCMarketEncoder()
        self.aif = ActiveInferenceDecider()
        self.memory = EbbinghausTradeMemory()

        self.recent_signals: deque[TradeSignal] = deque(maxlen=50)

        self.tick_count = 0
        self.order_count = 0

        self._seed_hdc_patterns()

    def _seed_hdc_patterns(self) -> None:
        patterns: dict[str, dict[str, float]] = {
            "bull_breakout": {
                "close": 0.9,
                "volume": 0.85,
                "rsi": 0.65,
                "trend": 0.80,
                "volatility": 0.45,
                "bb_upper": 0.30,
                "bb_lower": 0.90,
                "macd": 0.75,
                "open": 0.5,
                "high": 0.5,
                "low": 0.5,
            },
            "bear_breakdown": {
                "close": 0.1,
                "volume": 0.80,
                "rsi": 0.30,
                "trend": 0.15,
                "volatility": 0.50,
                "bb_upper": 0.90,
                "bb_lower": 0.10,
                "macd": 0.20,
                "open": 0.5,
                "high": 0.5,
                "low": 0.5,
            },
            "sideways_squeeze": {
                "close": 0.5,
                "volume": 0.30,
                "rsi": 0.50,
                "trend": 0.48,
                "volatility": 0.10,
                "bb_upper": 0.55,
                "bb_lower": 0.45,
                "macd": 0.50,
                "open": 0.5,
                "high": 0.5,
                "low": 0.5,
            },
            "high_volatility": {
                "close": 0.5,
                "volume": 0.90,
                "rsi": 0.50,
                "trend": 0.50,
                "volatility": 0.95,
                "bb_upper": 0.15,
                "bb_lower": 0.15,
                "macd": 0.50,
                "open": 0.5,
                "high": 0.5,
                "low": 0.5,
            },
        }

        for name, feat in patterns.items():
            hv = self.hdc.encode(feat)
            self.hdc.store_pattern(name, hv)

    def _position_size(self, portfolio: dict[str, Any], price: float, confidence: float, symbol: str, action: str) -> float:
        """Position sizing with compatibility:

        - If risk_per_trade <= 1.0: treat as fraction of portfolio (docs default 0.02 = 2%).
        - If risk_per_trade > 1.0: treat as USD (common UI expectation, e.g. 60 = $60).

        Also makes sizing cash/position-aware to avoid spammy rejected orders.
        """

        success_rate = float(self.memory.get_success_rate(symbol))

        positions = portfolio.get("positions") if isinstance(portfolio, dict) else None
        pos = positions.get(symbol) if isinstance(positions, dict) else None
        held_qty = float(pos.get("quantity", 0.0)) if isinstance(pos, dict) else 0.0
        cash_usdt = float(portfolio.get("usdt_cash", 0.0)) if isinstance(portfolio, dict) else 0.0
        total_value = float(portfolio.get("total_value_usd", 0.0)) if isinstance(portfolio, dict) else 0.0

        if action == "SELL":
            return round(max(0.0, held_qty), 6)

        # BUY sizing
        if held_qty > 0:
            return 0.0

        if self.risk_per_trade <= 1.0:
            base_allocation_usd = total_value * self.risk_per_trade
        else:
            base_allocation_usd = self.risk_per_trade

        # Safety caps
        base_allocation_usd = min(float(base_allocation_usd), float(cash_usdt))
        base_allocation_usd = min(float(base_allocation_usd), float(total_value) * 0.25)  # avoid over-allocation

        adjusted = float(base_allocation_usd) * float(confidence) * (0.5 + success_rate * 0.5)
        quantity = adjusted / (float(price) + 1e-10)
        return round(float(quantity), 6)

    def analyze(self, symbol: str) -> TradeSignal:
        klines = self.exchange.get_klines(symbol, "1h", 100)
        if not klines:
            return TradeSignal(symbol=symbol, action="HOLD", confidence=0.0, quantity=0.0, price=0.0, reason="No market data")

        features = compute_features(klines)
        price = float(klines[-1][4])

        hv = self.hdc.encode(features)
        pattern, pattern_sim = self.hdc.best_match(hv)

        posterior = self.aif.infer_state(features)
        action_raw, conf_raw = self.aif.decide(posterior, self.risk_per_trade)

        # If AIF is indecisive (HOLD), allow strong HDC pattern hits to propose a direction.
        # This is deliberately conservative: requires a decent pattern similarity AND that
        # the posterior isn't strongly contradicting it.
        pattern_override: Optional[str] = None
        action_candidate = action_raw
        conf_candidate = conf_raw
        if action_raw == "HOLD":
            bull_p = float(posterior.get("bull", 0.0))
            bear_p = float(posterior.get("bear", 0.0))
            if pattern == "bull_breakout" and pattern_sim >= 0.62 and bull_p >= (bear_p - 0.05):
                action_candidate = "BUY"
                conf_candidate = max(conf_candidate, 0.35 + 0.65 * float(pattern_sim))
                pattern_override = "bull_breakout"
            elif pattern == "bear_breakdown" and pattern_sim >= 0.62 and bear_p >= (bull_p - 0.05):
                action_candidate = "SELL"
                conf_candidate = max(conf_candidate, 0.35 + 0.65 * float(pattern_sim))
                pattern_override = "bear_breakdown"

        # Blend confidence with pattern similarity and memory success rate.
        success_rate = float(self.memory.get_success_rate(symbol))
        blended = float(conf_candidate) * (0.6 + pattern_sim * 0.4) * (0.7 + success_rate * 0.3)
        blended = float(np.clip(blended, 0.0, 1.0))

        action_final = action_candidate
        blocked_by_confidence = False
        if action_candidate in ("BUY", "SELL") and blended < self.min_confidence:
            action_final = "HOLD"
            blocked_by_confidence = True

        portfolio = self.exchange.get_portfolio_value()
        positions = portfolio.get("positions") if isinstance(portfolio, dict) else None
        pos = positions.get(symbol) if isinstance(positions, dict) else None
        held_qty = float(pos.get("quantity", 0.0)) if isinstance(pos, dict) else 0.0

        blocked_by_position = False
        if action_final == "BUY" and held_qty > 0:
            action_final = "HOLD"
            blocked_by_position = True
        if action_final == "SELL" and held_qty <= 0:
            action_final = "HOLD"
            blocked_by_position = True

        qty = self._position_size(portfolio, price, blended, symbol, action_final) if action_final in ("BUY", "SELL") else 0.0
        total_value = float(portfolio.get("total_value_usd", 0.0))
        position_size_usd = round(float(qty) * float(price), 6) if qty > 0 else 0.0

        reason = f"pattern={pattern} sim={pattern_sim:.2f} posterior={posterior}"
        details: dict[str, Any] = {
            "features": features,
            "posterior": posterior,
            "action_raw": action_raw,
            "action_candidate": action_candidate,
            "pattern_override": pattern_override,
            "confidence_raw": conf_raw,
            "confidence_candidate": conf_candidate,
            "confidence_blended": blended,
            "success_rate": success_rate,
            "min_confidence": self.min_confidence,
            "risk_per_trade": self.risk_per_trade,
            "portfolio_total_value_usd": total_value,
            "held_qty": held_qty,
            "blocked_by_confidence": blocked_by_confidence,
            "blocked_by_position": blocked_by_position,
            "position_size_usd": position_size_usd,
        }
        return TradeSignal(
            symbol=symbol,
            action=action_final,
            confidence=blended,
            quantity=qty,
            price=price,
            reason=reason,
            pattern=pattern,
            pattern_similarity=pattern_sim,
            details=details,
        )

    def execute(self, signal: TradeSignal) -> dict[str, Any] | None:
        if signal.action not in ("BUY", "SELL"):
            return None
        if signal.quantity <= 0:
            return {"status": "SKIPPED", "reason": "quantity<=0"}
        return self.exchange.place_order(signal.symbol, signal.action, signal.quantity, signal.price)

    def tick(self) -> dict[str, Any]:
        self.tick_count += 1
        signals: list[TradeSignal] = []
        orders: list[dict[str, Any]] = []

        for symbol in self.symbols:
            try:
                sig = self.analyze(symbol)
                signals.append(sig)
                self.recent_signals.append(sig)
                if sig.action in ("BUY", "SELL"):
                    self.memory.remember(sig)

                _send_bridge_event({"type": "trader_signal", "symbol": symbol, "signal": asdict(sig), "ts": _utc_now_iso()})

                # Persist every signal for full traceability
                try:
                    with open(TRADES_FILE, "a", encoding="utf-8") as f:
                        f.write(json.dumps({"type": "signal", "signal": asdict(sig)}, ensure_ascii=False) + "\n")
                except Exception:
                    pass

                order = self.execute(sig)
                if order is not None:
                    orders.append(order)
                    self.order_count += 1
                    _send_bridge_event({"type": "trader_order", "symbol": symbol, "order": order, "ts": _utc_now_iso()})

                    # Update memory outcome for closed positions (paper mode SELL)
                    try:
                        if order.get("status") == "FILLED" and order.get("side") == "SELL" and order.get("realized_pct") is not None:
                            self.memory.update_outcome(symbol, float(order.get("realized_pct")))
                    except Exception:
                        pass

                    # Persist trade record (jsonl)
                    try:
                        with open(TRADES_FILE, "a", encoding="utf-8") as f:
                            f.write(json.dumps({"type": "order", "signal": asdict(sig), "order": order}, ensure_ascii=False) + "\n")
                    except Exception:
                        pass

            except Exception as e:
                _log(f"ERROR analyze/execute {symbol}: {e}")
                _send_bridge_event({"type": "trader_error", "symbol": symbol, "error": str(e), "ts": _utc_now_iso()})

        portfolio = self.exchange.get_portfolio_value()
        state = {
            "running": True,
            "last_tick_at": _utc_now_iso(),
            "tick_count": self.tick_count,
            "order_count": self.order_count,
            "exchange": getattr(self.exchange, "name", self.exchange.__class__.__name__),
            "symbols": self.symbols,
            "paper_mode": self.exchange.paper_mode,
            "risk_per_trade": self.risk_per_trade,
            "min_confidence": self.min_confidence,
            "portfolio": portfolio,
            "recent_signals": [asdict(s) for s in list(self.recent_signals)[-20:]],
            "memory": self.memory.stats(),
        }

        try:
            _ensure_dirs()
            STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception:
            pass

        return {"signals": [asdict(s) for s in signals], "orders": orders, "portfolio": portfolio}


_shutdown = False


def _handle_shutdown(_signum: int, _frame: Any) -> None:
    global _shutdown
    _shutdown = True


def _parse_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    v = value.strip().lower()
    if v in ("1", "true", "yes", "y", "on"):
        return True
    if v in ("0", "false", "no", "n", "off"):
        return False
    return default


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true", help="Run one tick then exit")
    args = parser.parse_args()

    paper_mode = _parse_bool(os.environ.get("TRADING_PAPER_MODE"), True)
    allow_live = _parse_bool(os.environ.get("TRADING_ALLOW_LIVE"), False)

    exchange_name = (os.environ.get("TRADING_EXCHANGE") or "binance").strip().lower()
    if exchange_name not in ("binance", "kraken"):
        exchange_name = "binance"

    default_symbols = "BTCUSDT,ETHUSDT" if exchange_name == "binance" else "XBTUSDT,ETHUSDT"
    symbols_env = os.environ.get("TRADING_SYMBOLS", default_symbols)

    symbols = [s.strip().upper() for s in symbols_env.split(",") if s.strip()]
    interval_seconds = int(float(os.environ.get("TRADING_INTERVAL_SECONDS", "3600")))
    risk_per_trade = float(os.environ.get("TRADING_RISK_PER_TRADE", "0.02"))
    min_conf = float(os.environ.get("TRADING_MIN_CONFIDENCE", "0.60"))

    if exchange_name == "kraken":
        base_url = os.environ.get("KRAKEN_BASE_URL") or "https://api.kraken.com"
        api_key = os.environ.get("KRAKEN_API_KEY", "")
        api_secret = os.environ.get("KRAKEN_API_SECRET", "")
    else:
        base_url = os.environ.get("BINANCE_BASE_URL") or "https://api.binance.com"
        api_key = os.environ.get("BINANCE_API_KEY", "")
        api_secret = os.environ.get("BINANCE_API_SECRET", "")

    _ensure_dirs()

    _log("=== Frankenstein Trading Bot starting ===")
    _log(f"exchange={exchange_name} symbols={symbols} paper_mode={paper_mode} interval={interval_seconds}s")

    _send_bridge_event({
        "type": "trader_start",
        "exchange": exchange_name,
        "symbols": symbols,
        "paper_mode": paper_mode,
        "interval_seconds": interval_seconds,
        "ts": _utc_now_iso(),
    })

    exchange: ExchangeClient
    if exchange_name == "kraken":
        exchange = KrakenClient(
            api_key=api_key,
            api_secret=api_secret,
            paper_mode=paper_mode,
            base_url=base_url,
            allow_live=allow_live,
        )
    else:
        exchange = BinanceClient(
            api_key=api_key,
            api_secret=api_secret,
            paper_mode=paper_mode,
            base_url=base_url,
            allow_live=allow_live,
        )
    agent = FrankensteinTradingAgent(exchange, symbols, risk_per_trade, min_conf)

    signal.signal(signal.SIGINT, _handle_shutdown)
    signal.signal(signal.SIGTERM, _handle_shutdown)

    last_tick = time.time()

    while not _shutdown:
        try:
            _send_bridge_event({"type": "trader_tick_start", "ts": _utc_now_iso()})
            t0 = time.time()
            result = agent.tick()
            elapsed = time.time() - t0
            _send_bridge_event({"type": "trader_tick_done", "elapsed_seconds": round(elapsed, 3), "portfolio": result.get("portfolio"), "ts": _utc_now_iso()})
            _log(f"tick done: signals={len(result.get('signals', []))} orders={len(result.get('orders', []))} elapsed={elapsed:.2f}s total=${result.get('portfolio', {}).get('total_value_usd', 0)}")

            now = time.time()
            agent.memory.apply_decay((now - last_tick) / 3600.0)
            last_tick = now

            if args.once:
                break

        except Exception as e:
            _log(f"FATAL: {e}")
            _send_bridge_event({"type": "trader_fatal", "error": str(e), "ts": _utc_now_iso()})

        # Sleep with interruptibility
        end = time.time() + max(interval_seconds, 5)
        while time.time() < end and not _shutdown:
            time.sleep(0.5)

    _send_bridge_event({"type": "trader_stop", "ts": _utc_now_iso()})
    _log("=== Frankenstein Trading Bot stopped ===")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
