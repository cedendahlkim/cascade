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
import hashlib
import hmac
import json
import os
import signal
import sys
import time
from collections import deque
from dataclasses import dataclass, asdict, field
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

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
        if volatility > 0.7:
            return 3
        if trend > 0.65:
            return 0
        if trend < 0.35:
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

        if bull_p > 0.55 and vol_penalty < 0.2:
            return "BUY", round(bull_p - vol_penalty, 3)
        if bear_p > 0.55 and vol_penalty < 0.2:
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
        self.api_key = api_key
        self.api_secret = api_secret
        self.paper_mode = paper_mode
        self.base_url = base_url.rstrip("/")
        self.allow_live = allow_live

        self._paper_balance = {"USDT": float(starting_usdt)}
        self._paper_positions: dict[str, float] = {}

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
            if side == "BUY":
                if self._paper_balance.get("USDT", 0.0) >= cost:
                    self._paper_balance["USDT"] -= cost
                    self._paper_positions[symbol] = self._paper_positions.get(symbol, 0.0) + float(quantity)
                    status = "FILLED"
                else:
                    status = "REJECTED (insufficient funds)"
            elif side == "SELL":
                held = self._paper_positions.get(symbol, 0.0)
                if held >= quantity:
                    self._paper_positions[symbol] = held - float(quantity)
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
        for sym, qty in self._paper_positions.items():
            if qty <= 0:
                continue
            price = self.get_price(sym)
            val = qty * price
            total += val
            positions[sym] = {"quantity": round(qty, 8), "value_usd": round(val, 2)}
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
        exchange: BinanceClient,
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

    def _position_size(self, price: float, confidence: float, symbol: str) -> float:
        portfolio = self.exchange.get_portfolio_value()
        total_value = float(portfolio.get("total_value_usd", 0.0))
        success_rate = float(self.memory.get_success_rate(symbol))

        base_allocation = total_value * self.risk_per_trade
        adjusted = base_allocation * float(confidence) * (0.5 + success_rate * 0.5)
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
        action, conf = self.aif.decide(posterior, self.risk_per_trade)

        # Blend confidence with pattern similarity and memory success rate.
        success_rate = float(self.memory.get_success_rate(symbol))
        blended = float(conf) * (0.6 + pattern_sim * 0.4) * (0.7 + success_rate * 0.3)
        blended = float(np.clip(blended, 0.0, 1.0))

        if action in ("BUY", "SELL") and blended < self.min_confidence:
            return TradeSignal(
                symbol=symbol,
                action="HOLD",
                confidence=blended,
                quantity=0.0,
                price=price,
                reason=f"Below min_confidence ({blended:.2f} < {self.min_confidence:.2f})",
                pattern=pattern,
                pattern_similarity=pattern_sim,
            )

        qty = self._position_size(price, blended, symbol) if action in ("BUY", "SELL") else 0.0

        reason = f"pattern={pattern} sim={pattern_sim:.2f} posterior={posterior}"
        return TradeSignal(
            symbol=symbol,
            action=action,
            confidence=blended,
            quantity=qty,
            price=price,
            reason=reason,
            pattern=pattern,
            pattern_similarity=pattern_sim,
        )

    def execute(self, signal: TradeSignal) -> dict[str, Any] | None:
        if signal.action not in ("BUY", "SELL"):
            return None
        if signal.quantity <= 0:
            return {"status": "SKIPPED", "reason": "quantity<=0"}
        return self.exchange.place_order(signal.symbol, signal.action, signal.quantity, signal.price)

    def tick(self) -> dict[str, Any]:
        signals: list[TradeSignal] = []
        orders: list[dict[str, Any]] = []

        for symbol in self.symbols:
            try:
                sig = self.analyze(symbol)
                signals.append(sig)
                self.recent_signals.append(sig)
                self.memory.remember(sig)

                _send_bridge_event({"type": "trader_signal", "symbol": symbol, "signal": asdict(sig), "ts": _utc_now_iso()})

                order = self.execute(sig)
                if order is not None:
                    orders.append(order)
                    _send_bridge_event({"type": "trader_order", "symbol": symbol, "order": order, "ts": _utc_now_iso()})

                    # Persist trade record (jsonl)
                    try:
                        with open(TRADES_FILE, "a", encoding="utf-8") as f:
                            f.write(json.dumps({"signal": asdict(sig), "order": order}, ensure_ascii=False) + "\n")
                    except Exception:
                        pass

            except Exception as e:
                _log(f"ERROR analyze/execute {symbol}: {e}")
                _send_bridge_event({"type": "trader_error", "symbol": symbol, "error": str(e), "ts": _utc_now_iso()})

        portfolio = self.exchange.get_portfolio_value()
        state = {
            "running": True,
            "last_tick_at": _utc_now_iso(),
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

    symbols = [s.strip().upper() for s in os.environ.get("TRADING_SYMBOLS", "BTCUSDT,ETHUSDT").split(",") if s.strip()]
    interval_seconds = int(float(os.environ.get("TRADING_INTERVAL_SECONDS", "3600")))
    risk_per_trade = float(os.environ.get("TRADING_RISK_PER_TRADE", "0.02"))
    min_conf = float(os.environ.get("TRADING_MIN_CONFIDENCE", "0.60"))

    base_url = os.environ.get("BINANCE_BASE_URL")
    if not base_url:
        # In paper mode we default to public (real) market data; orders remain simulated.
        base_url = "https://api.binance.com"

    api_key = os.environ.get("BINANCE_API_KEY", "")
    api_secret = os.environ.get("BINANCE_API_SECRET", "")

    _ensure_dirs()

    _log("=== Frankenstein Trading Bot starting ===")
    _log(f"symbols={symbols} paper_mode={paper_mode} interval={interval_seconds}s")

    _send_bridge_event({
        "type": "trader_start",
        "symbols": symbols,
        "paper_mode": paper_mode,
        "interval_seconds": interval_seconds,
        "ts": _utc_now_iso(),
    })

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
