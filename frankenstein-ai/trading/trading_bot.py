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
MANUAL_ORDERS_FILE = DATA_DIR / "manual_orders.jsonl"

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
        kline_interval: str = "1h",
        max_positions: int = 2,
        cooldown_seconds: int = 0,
        take_profit_pct: float = 0.0,
        stop_loss_pct: float = 0.0,
        trailing_stop_pct: float = 0.0,
        aggression: float = 0.5,
        strategy: str = "inference",
        grid_levels: int = 0,
        grid_spacing: str = "linear",
        grid_budget: float = 0.25,
        grid_lower: float = 0.0,
        grid_upper: float = 0.0,
    ) -> None:
        self.exchange = exchange
        self.symbols = symbols
        self.risk_per_trade = float(risk_per_trade)
        self.min_confidence = float(min_confidence)

        self.kline_interval = (kline_interval or "1h").strip()
        self.max_positions = max(1, int(max_positions))
        self.cooldown_seconds = max(0, int(cooldown_seconds))
        self.take_profit_pct = max(0.0, float(take_profit_pct))
        self.stop_loss_pct = max(0.0, float(stop_loss_pct))
        self.trailing_stop_pct = max(0.0, float(trailing_stop_pct))
        self.aggression = float(np.clip(float(aggression), 0.0, 1.0))

        self.strategy = (strategy or "inference").strip().lower()
        if self.strategy not in ("inference", "grid"):
            self.strategy = "inference"

        # Grid strategy config (used when strategy == "grid")
        self.grid_levels = max(2, int(grid_levels)) if int(grid_levels) > 0 else 0
        self.grid_spacing = (grid_spacing or "linear").strip().lower()
        if self.grid_spacing not in ("linear", "geometric"):
            self.grid_spacing = "linear"
        self.grid_budget = float(grid_budget)
        self.grid_lower = float(grid_lower)
        self.grid_upper = float(grid_upper)

        # Per-symbol grid runtime state
        self._grid_bounds_by_symbol: dict[str, tuple[float, float]] = {}
        self._grid_levels_by_symbol: dict[str, list[float]] = {}
        self._grid_filled_by_symbol: dict[str, dict[int, float]] = {}

        self.hdc = HDCMarketEncoder()
        self.aif = ActiveInferenceDecider()
        self.memory = EbbinghausTradeMemory()

        # Per-symbol runtime guards
        self._last_trade_epoch: dict[str, float] = {}
        self._trail_peak: dict[str, float] = {}

        # Aggression dials (0..1). Higher aggression => easier to enter trades.
        # We set instance attributes that override the class-level defaults.
        trend_span = 0.08 - (self.aggression * 0.04)  # 0.08 -> 0.04
        self.aif.TREND_BULL_EDGE = 0.5 + trend_span * 0.5
        self.aif.TREND_BEAR_EDGE = 0.5 - trend_span * 0.5
        self.aif.TRADE_STATE_PROB_EDGE = 0.56 - (self.aggression * 0.08)  # 0.56 -> 0.48
        self._pattern_sim_edge = 0.62 - (self.aggression * 0.06)  # 0.62 -> 0.56

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

    def _grid_budget_usd_per_symbol(self, portfolio: dict[str, Any]) -> float:
        """Grid budget for *one* symbol.

        - If grid_budget <= 1.0: treat as fraction of portfolio value.
        - If grid_budget > 1.0: treat as USD.
        """

        cash_usdt = float(portfolio.get("usdt_cash", 0.0)) if isinstance(portfolio, dict) else 0.0
        total_value = float(portfolio.get("total_value_usd", 0.0)) if isinstance(portfolio, dict) else 0.0
        if self.grid_budget <= 1.0:
            budget = total_value * float(self.grid_budget)
        else:
            budget = float(self.grid_budget)

        # Divide budget across symbols (grid usually runs on 1, but we keep it safe)
        per_symbol = float(budget) / float(max(1, len(self.symbols)))
        per_symbol = min(per_symbol, float(cash_usdt))
        per_symbol = max(0.0, per_symbol)
        return float(per_symbol)

    @staticmethod
    def _grid_build_levels(lower: float, upper: float, levels: int, spacing: str) -> list[float]:
        if not (lower > 0 and upper > lower and levels >= 2):
            return []
        if spacing == "geometric":
            ratio = (upper / lower) ** (1.0 / float(levels - 1))
            return [float(lower * (ratio**i)) for i in range(levels)]

        step = (upper - lower) / float(levels - 1)
        return [float(lower + step * i) for i in range(levels)]

    def _grid_ensure_levels(self, symbol: str) -> list[float]:
        levels = self._grid_levels_by_symbol.get(symbol)
        if levels:
            return levels

        # Bounds: use explicit env values when valid, else infer from recent klines.
        lower = float(self.grid_lower)
        upper = float(self.grid_upper)
        if not (lower > 0 and upper > lower):
            try:
                kl = self.exchange.get_klines(symbol, self.kline_interval, 120)
                lows = [float(r[3]) for r in kl if isinstance(r, (list, tuple)) and len(r) > 4]
                highs = [float(r[2]) for r in kl if isinstance(r, (list, tuple)) and len(r) > 4]
                if lows and highs:
                    lo = max(1e-12, float(min(lows)))
                    hi = float(max(highs))
                    # small padding to reduce immediate edge-trigger spam
                    lower = lo * 0.995
                    upper = hi * 1.005
            except Exception:
                pass

        n = int(self.grid_levels) if int(self.grid_levels) >= 2 else 12
        built = self._grid_build_levels(lower, upper, n, self.grid_spacing)
        if built:
            self._grid_bounds_by_symbol[symbol] = (float(lower), float(upper))
            self._grid_levels_by_symbol[symbol] = built
            self._grid_filled_by_symbol.setdefault(symbol, {})
        return self._grid_levels_by_symbol.get(symbol, [])

    def _grid_analyze(self, symbol: str) -> TradeSignal:
        price = float(self.exchange.get_price(symbol))
        portfolio = self.exchange.get_portfolio_value()

        levels = self._grid_ensure_levels(symbol)
        filled = self._grid_filled_by_symbol.setdefault(symbol, {})

        # Cooldown gate
        now_epoch = time.time()
        cooldown_remaining = 0.0
        if self.cooldown_seconds > 0:
            last_trade = float(self._last_trade_epoch.get(symbol, 0.0) or 0.0)
            cooldown_remaining = max(0.0, (last_trade + float(self.cooldown_seconds)) - now_epoch)
            if cooldown_remaining > 0:
                return TradeSignal(
                    symbol=symbol,
                    action="HOLD",
                    confidence=1.0,
                    quantity=0.0,
                    price=price,
                    reason=f"grid cooldown {cooldown_remaining:.1f}s",
                    pattern="grid",
                    pattern_similarity=1.0,
                    details={"strategy": "grid", "cooldown_remaining_seconds": round(float(cooldown_remaining), 3)},
                )

        if len(levels) < 2 or price <= 0:
            return TradeSignal(symbol=symbol, action="HOLD", confidence=1.0, quantity=0.0, price=price, reason="grid not ready")

        # Position info (aggregated in exchange)
        positions = portfolio.get("positions") if isinstance(portfolio, dict) else None
        pos = positions.get(symbol) if isinstance(positions, dict) else None
        held_qty = float(pos.get("quantity", 0.0)) if isinstance(pos, dict) else 0.0

        # 1) Sell first: if we own level i and price >= next level i+1
        for i in sorted(list(filled.keys()), reverse=True):
            if i + 1 >= len(levels):
                continue
            target = float(levels[i + 1])
            if price >= target:
                qty = float(filled.get(i, 0.0))
                qty = min(qty, held_qty)
                qty = round(max(0.0, qty), 6)
                if qty <= 0:
                    continue
                return TradeSignal(
                    symbol=symbol,
                    action="SELL",
                    confidence=1.0,
                    quantity=qty,
                    price=price,
                    reason=f"grid sell level={i} -> {i + 1} @>= {target:.6f}",
                    pattern="grid",
                    pattern_similarity=1.0,
                    details={
                        "strategy": "grid",
                        "grid_level_index": i,
                        "grid_sell_to_level": i + 1,
                        "grid_sell_target_price": target,
                        "grid_price": price,
                    },
                )

        # 2) Buy: find the highest level (closest above price) that is not filled.
        buy_i: Optional[int] = None
        for i in range(0, len(levels) - 1):
            if i in filled:
                continue
            if price <= float(levels[i]):
                buy_i = i

        if buy_i is None:
            return TradeSignal(symbol=symbol, action="HOLD", confidence=1.0, quantity=0.0, price=price, reason="grid no trigger")

        per_symbol_budget = float(self._grid_budget_usd_per_symbol(portfolio))
        per_level_budget = per_symbol_budget / float(max(1, len(levels) - 1))
        per_level_budget = max(0.0, per_level_budget)

        cash_usdt = float(portfolio.get("usdt_cash", 0.0)) if isinstance(portfolio, dict) else 0.0
        spend = min(float(per_level_budget), float(cash_usdt))
        if spend <= 1.0:
            return TradeSignal(symbol=symbol, action="HOLD", confidence=1.0, quantity=0.0, price=price, reason="grid insufficient cash")

        qty = round(float(spend) / (float(price) + 1e-12), 6)
        if qty <= 0:
            return TradeSignal(symbol=symbol, action="HOLD", confidence=1.0, quantity=0.0, price=price, reason="grid qty<=0")

        return TradeSignal(
            symbol=symbol,
            action="BUY",
            confidence=1.0,
            quantity=qty,
            price=price,
            reason=f"grid buy level={buy_i} @<= {float(levels[buy_i]):.6f}",
            pattern="grid",
            pattern_similarity=1.0,
            details={
                "strategy": "grid",
                "grid_level_index": buy_i,
                "grid_buy_level_price": float(levels[buy_i]),
                "grid_price": price,
                "grid_spacing": self.grid_spacing,
                "grid_levels": len(levels),
                "grid_budget_per_symbol_usd": round(float(per_symbol_budget), 6),
                "grid_budget_per_level_usd": round(float(per_level_budget), 6),
            },
        )

    def _grid_on_filled_order(self, signal: TradeSignal, order: dict[str, Any]) -> None:
        try:
            if not str(order.get("status", "")).startswith("FILLED"):
                return
            symbol = str(signal.symbol).strip().upper()
            idx_raw = signal.details.get("grid_level_index") if isinstance(signal.details, dict) else None
            if idx_raw is None:
                return
            idx = int(idx_raw)
            filled = self._grid_filled_by_symbol.setdefault(symbol, {})
            qty = float(order.get("quantity", signal.quantity) or 0.0)
            qty = round(max(0.0, qty), 6)
            if qty <= 0:
                return
            if signal.action == "BUY":
                filled[idx] = float(filled.get(idx, 0.0)) + qty
            elif signal.action == "SELL":
                # Selling releases the level
                filled.pop(idx, None)
        except Exception:
            return

    def analyze(self, symbol: str) -> TradeSignal:
        klines = self.exchange.get_klines(symbol, self.kline_interval, 100)
        if not klines:
            return TradeSignal(symbol=symbol, action="HOLD", confidence=0.0, quantity=0.0, price=0.0, reason="No market data")

        features = compute_features(klines)
        price = float(klines[-1][4])

        portfolio = self.exchange.get_portfolio_value()
        positions = portfolio.get("positions") if isinstance(portfolio, dict) else None
        pos = positions.get(symbol) if isinstance(positions, dict) else None
        held_qty = float(pos.get("quantity", 0.0)) if isinstance(pos, dict) else 0.0
        avg_entry: Optional[float] = float(pos.get("avg_entry")) if isinstance(pos, dict) and pos.get("avg_entry") is not None else None

        hv = self.hdc.encode(features)
        pattern, pattern_sim = self.hdc.best_match(hv)

        posterior = self.aif.infer_state(features)
        action_raw, conf_raw = self.aif.decide(posterior, self.risk_per_trade)

        now_epoch = time.time()
        cooldown_remaining = 0.0
        if self.cooldown_seconds > 0:
            last_trade = float(self._last_trade_epoch.get(symbol, 0.0) or 0.0)
            cooldown_remaining = max(0.0, (last_trade + float(self.cooldown_seconds)) - now_epoch)

        open_positions = 0
        if isinstance(positions, dict):
            for p in positions.values():
                try:
                    if float(p.get("quantity", 0.0)) > 0:
                        open_positions += 1
                except Exception:
                    continue

        # --- Exit rules (TP/SL/trailing) ---
        exit_override: Optional[str] = None
        if held_qty > 0 and avg_entry is not None and avg_entry > 0:
            pnl_pct = ((float(price) - float(avg_entry)) / (float(avg_entry) + 1e-12)) * 100.0
            # Track peak for trailing stop
            peak = float(self._trail_peak.get(symbol, float(avg_entry)))
            if float(price) > peak:
                peak = float(price)
                self._trail_peak[symbol] = peak

            if self.take_profit_pct > 0 and pnl_pct >= self.take_profit_pct:
                action_raw, conf_raw = "SELL", max(conf_raw, 0.85)
                exit_override = "take_profit"
            elif self.stop_loss_pct > 0 and pnl_pct <= -self.stop_loss_pct:
                action_raw, conf_raw = "SELL", max(conf_raw, 0.92)
                exit_override = "stop_loss"
            elif self.trailing_stop_pct > 0:
                stop_price = peak * (1.0 - (self.trailing_stop_pct / 100.0))
                if float(price) <= stop_price:
                    action_raw, conf_raw = "SELL", max(conf_raw, 0.88)
                    exit_override = "trailing_stop"

        # If AIF is indecisive (HOLD), allow strong HDC pattern hits to propose a direction.
        # This is deliberately conservative: requires a decent pattern similarity AND that
        # the posterior isn't strongly contradicting it.
        pattern_override: Optional[str] = None
        action_candidate = action_raw
        conf_candidate = conf_raw
        if action_raw == "HOLD":
            bull_p = float(posterior.get("bull", 0.0))
            bear_p = float(posterior.get("bear", 0.0))
            if pattern == "bull_breakout" and pattern_sim >= self._pattern_sim_edge and bull_p >= (bear_p - 0.05):
                action_candidate = "BUY"
                conf_candidate = max(conf_candidate, 0.35 + 0.65 * float(pattern_sim))
                pattern_override = "bull_breakout"
            elif pattern == "bear_breakdown" and pattern_sim >= self._pattern_sim_edge and bear_p >= (bull_p - 0.05):
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

        blocked_by_cooldown = False
        if action_final in ("BUY", "SELL") and cooldown_remaining > 0:
            action_final = "HOLD"
            blocked_by_cooldown = True

        blocked_by_max_positions = False
        if action_final == "BUY" and open_positions >= self.max_positions:
            action_final = "HOLD"
            blocked_by_max_positions = True

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
            "exit_override": exit_override,
            "confidence_raw": conf_raw,
            "confidence_candidate": conf_candidate,
            "confidence_blended": blended,
            "success_rate": success_rate,
            "min_confidence": self.min_confidence,
            "risk_per_trade": self.risk_per_trade,
            "kline_interval": self.kline_interval,
            "max_positions": self.max_positions,
            "cooldown_seconds": self.cooldown_seconds,
            "cooldown_remaining_seconds": round(float(cooldown_remaining), 3),
            "take_profit_pct": self.take_profit_pct,
            "stop_loss_pct": self.stop_loss_pct,
            "trailing_stop_pct": self.trailing_stop_pct,
            "aggression": self.aggression,
            "portfolio_total_value_usd": total_value,
            "held_qty": held_qty,
            "blocked_by_confidence": blocked_by_confidence,
            "blocked_by_cooldown": blocked_by_cooldown,
            "blocked_by_max_positions": blocked_by_max_positions,
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

    def _process_manual_orders(self) -> list[dict[str, Any]]:
        """Read and execute manual orders from the queue file."""
        results: list[dict[str, Any]] = []
        if not MANUAL_ORDERS_FILE.exists():
            return results
        try:
            lines = MANUAL_ORDERS_FILE.read_text(encoding="utf-8").strip().splitlines()
            if not lines:
                return results
            # Clear the file immediately to avoid re-processing
            MANUAL_ORDERS_FILE.write_text("", encoding="utf-8")
            for line in lines:
                try:
                    data = json.loads(line)
                    symbol = str(data.get("symbol", "")).upper().strip()
                    side = str(data.get("side", "")).upper().strip()
                    qty = float(data.get("quantity", 0))
                    price_raw = data.get("price")
                    if not symbol or side not in ("BUY", "SELL") or qty <= 0:
                        _log(f"MANUAL ORDER SKIPPED: invalid data {data}")
                        continue
                    # Use provided price or fetch current market price
                    if price_raw is not None and float(price_raw) > 0:
                        price = float(price_raw)
                    else:
                        try:
                            price = self.exchange.get_price(symbol)
                        except Exception as e:
                            _log(f"MANUAL ORDER FAILED: could not get price for {symbol}: {e}")
                            continue
                    _log(f"MANUAL ORDER: {side} {qty} {symbol} @ {price}")
                    order = self.exchange.place_order(symbol, side, qty, price)
                    results.append(order)
                    self.order_count += 1
                    _send_bridge_event({"type": "manual_order_executed", "symbol": symbol, "side": side, "quantity": qty, "price": price, "order": order, "ts": _utc_now_iso()})
                    try:
                        with open(TRADES_FILE, "a", encoding="utf-8") as f:
                            f.write(json.dumps({"type": "manual_order", "symbol": symbol, "side": side, "quantity": qty, "price": price, "order": order}, ensure_ascii=False) + "\n")
                    except Exception:
                        pass
                except Exception as e:
                    _log(f"MANUAL ORDER ERROR: {e} — line: {line[:100]}")
        except Exception as e:
            _log(f"MANUAL ORDERS FILE ERROR: {e}")
        return results

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

        # Process any manual orders from the UI
        manual_results = self._process_manual_orders()
        orders.extend(manual_results)

        for symbol in self.symbols:
            try:
                sig = self._grid_analyze(symbol) if self.strategy == "grid" else self.analyze(symbol)
                signals.append(sig)
                self.recent_signals.append(sig)
                if self.strategy != "grid" and sig.action in ("BUY", "SELL"):
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

                    if self.strategy == "grid":
                        self._grid_on_filled_order(sig, order)

                    # Cooldown + trailing bookkeeping (only when an order actually fills)
                    try:
                        if str(order.get("status", "")).startswith("FILLED"):
                            self._last_trade_epoch[symbol] = time.time()
                            side = str(order.get("side") or order.get("type") or "").upper()
                            if side == "BUY":
                                self._trail_peak[symbol] = float(sig.price)
                            elif side == "SELL":
                                self._trail_peak.pop(symbol, None)
                    except Exception:
                        pass

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

        # Optional burst controls (set by bridge when user/AI asks for N orders)
        try:
            target_order_count = int(float(os.environ.get("TRADING_TARGET_ORDER_COUNT", "0")))
        except Exception:
            target_order_count = 0
        try:
            max_runtime_seconds = int(float(os.environ.get("TRADING_MAX_RUNTIME_SECONDS", "0")))
        except Exception:
            max_runtime_seconds = 0

        state = {
            "running": True,
            "last_tick_at": _utc_now_iso(),
            "tick_count": self.tick_count,
            "order_count": self.order_count,
            "target_order_count": target_order_count,
            "target_order_remaining": max(0, target_order_count - self.order_count) if target_order_count > 0 else 0,
            "max_runtime_seconds": max_runtime_seconds,
            "strategy": self.strategy,
            "exchange": getattr(self.exchange, "name", self.exchange.__class__.__name__),
            "symbols": self.symbols,
            "paper_mode": self.exchange.paper_mode,
            "risk_per_trade": self.risk_per_trade,
            "min_confidence": self.min_confidence,
            "kline_interval": self.kline_interval,
            "max_positions": self.max_positions,
            "cooldown_seconds": self.cooldown_seconds,
            "take_profit_pct": self.take_profit_pct,
            "stop_loss_pct": self.stop_loss_pct,
            "trailing_stop_pct": self.trailing_stop_pct,
            "aggression": self.aggression,
            "grid": {
                "enabled": self.strategy == "grid",
                "levels": self.grid_levels,
                "spacing": self.grid_spacing,
                "budget": self.grid_budget,
                "lower": self.grid_lower,
                "upper": self.grid_upper,
                "by_symbol": {
                    sym: {
                        "bounds": self._grid_bounds_by_symbol.get(sym),
                        "levels_count": len(self._grid_levels_by_symbol.get(sym, [])),
                        "filled_levels": sorted(list(self._grid_filled_by_symbol.get(sym, {}).keys())),
                        "filled_count": len(self._grid_filled_by_symbol.get(sym, {})),
                    }
                    for sym in self.symbols
                },
            },
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

    kline_interval = (os.environ.get("TRADING_KLINE_INTERVAL") or "1h").strip()
    max_positions = int(float(os.environ.get("TRADING_MAX_POSITIONS", "2")))
    cooldown_seconds = int(float(os.environ.get("TRADING_COOLDOWN_SECONDS", "0")))
    take_profit_pct = float(os.environ.get("TRADING_TAKE_PROFIT_PCT", "0"))
    stop_loss_pct = float(os.environ.get("TRADING_STOP_LOSS_PCT", "0"))
    trailing_stop_pct = float(os.environ.get("TRADING_TRAILING_STOP_PCT", "0"))
    aggression = float(os.environ.get("TRADING_AGGRESSION", "0.5"))

    strategy = (os.environ.get("TRADING_STRATEGY") or "inference").strip().lower()
    grid_levels = int(float(os.environ.get("TRADING_GRID_LEVELS", "0")))
    grid_spacing = (os.environ.get("TRADING_GRID_SPACING") or "linear").strip().lower()
    grid_budget = float(os.environ.get("TRADING_GRID_BUDGET", "0.25"))
    grid_lower = float(os.environ.get("TRADING_GRID_LOWER", "0"))
    grid_upper = float(os.environ.get("TRADING_GRID_UPPER", "0"))

    # Optional burst controls
    try:
        target_order_count = int(float(os.environ.get("TRADING_TARGET_ORDER_COUNT", "0")))
    except Exception:
        target_order_count = 0
    try:
        max_runtime_seconds = int(float(os.environ.get("TRADING_MAX_RUNTIME_SECONDS", "0")))
    except Exception:
        max_runtime_seconds = 0

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
    _log(f"exchange={exchange_name} symbols={symbols} paper_mode={paper_mode} interval={interval_seconds}s strategy={strategy}")
    if target_order_count > 0:
        _log(f"burst: target_order_count={target_order_count}")
    if max_runtime_seconds > 0:
        _log(f"burst: max_runtime_seconds={max_runtime_seconds}")
    if strategy == "grid":
        _log(f"grid: levels={grid_levels} spacing={grid_spacing} budget={grid_budget} lower={grid_lower} upper={grid_upper}")

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
    agent = FrankensteinTradingAgent(
        exchange,
        symbols,
        risk_per_trade,
        min_conf,
        kline_interval=kline_interval,
        max_positions=max_positions,
        cooldown_seconds=cooldown_seconds,
        take_profit_pct=take_profit_pct,
        stop_loss_pct=stop_loss_pct,
        trailing_stop_pct=trailing_stop_pct,
        aggression=aggression,
        strategy=strategy,
        grid_levels=grid_levels,
        grid_spacing=grid_spacing,
        grid_budget=grid_budget,
        grid_lower=grid_lower,
        grid_upper=grid_upper,
    )

    signal.signal(signal.SIGINT, _handle_shutdown)
    signal.signal(signal.SIGTERM, _handle_shutdown)

    last_tick = time.time()
    started_epoch = time.time()

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

            if target_order_count > 0 and agent.order_count >= target_order_count:
                _log(f"burst done: target orders reached ({agent.order_count}/{target_order_count})")
                _send_bridge_event({
                    "type": "trader_burst_done",
                    "reason": "target_orders",
                    "order_count": agent.order_count,
                    "target_order_count": target_order_count,
                    "ts": _utc_now_iso(),
                })
                break

            if max_runtime_seconds > 0 and (time.time() - started_epoch) >= max_runtime_seconds:
                _log(f"burst done: max runtime reached ({max_runtime_seconds}s)")
                _send_bridge_event({
                    "type": "trader_burst_done",
                    "reason": "max_runtime",
                    "order_count": agent.order_count,
                    "target_order_count": target_order_count,
                    "max_runtime_seconds": max_runtime_seconds,
                    "ts": _utc_now_iso(),
                })
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
